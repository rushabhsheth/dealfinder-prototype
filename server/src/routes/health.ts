import type { FastifyInstance } from "fastify";
import { adminDb } from "../db/supabase.js";

/**
 * Liveness + readiness.
 *   GET /health   → process is up (no external deps touched).
 *   GET /ready    → can reach Supabase (cheap round-trip against entitlements).
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));

  app.get("/ready", async (_req, reply) => {
    const { error } = await adminDb
      .from("entitlements")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return reply.code(503).send({ status: "degraded", db: error.message });
    }
    return reply.send({ status: "ok", db: "ok" });
  });
}
