import type { FastifyInstance } from "fastify";
import { requireUser, requirePremium } from "../auth/middleware.js";
import { startScan, getScanStatus } from "../services/scan.js";
import { NEUTRAL_PREFERENCES, type RankPreferences } from "../services/ranking.js";

/**
 * Scan routes (Phase 2).
 *   POST /scans       start an async inbox scan → { scanId }
 *   GET  /scans/:id   poll status/progress for the First Scan screen
 *
 * Premium-gated (requirePremium): scanning is a trial/paid capability; an expired
 * trial is downgraded lazily and rejected with 402 (the frontend shows locked).
 */
export async function scanRoutes(app: FastifyInstance): Promise<void> {
  app.post("/scans", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const body = (req.body ?? {}) as {
      preferences?: { categories?: unknown; brands?: unknown };
    };
    const prefs: RankPreferences = {
      categories: Array.isArray(body.preferences?.categories)
        ? (body.preferences!.categories as unknown[]).filter(
            (c): c is string => typeof c === "string",
          )
        : NEUTRAL_PREFERENCES.categories,
      brands: Array.isArray(body.preferences?.brands)
        ? (body.preferences!.brands as unknown[]).filter(
            (b): b is string => typeof b === "string",
          )
        : NEUTRAL_PREFERENCES.brands,
    };

    try {
      const result = await startScan(req.user!.id, prefs);
      return reply.send(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "scan failed to start";
      const code = /no active inbox/i.test(msg) ? 409 : 503;
      return reply.code(code).send({ error: msg });
    }
  });

  app.get("/scans/:id", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const scan = await getScanStatus(req.user!.id, id);
    if (!scan) return reply.code(404).send({ error: "Scan not found" });
    return reply.send({ scan });
  });
}
