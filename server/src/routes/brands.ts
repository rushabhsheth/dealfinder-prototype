import type { FastifyInstance } from "fastify";
import { requireUser, requirePremium } from "../auth/middleware.js";
import {
  listBrands,
  setBrandStatus,
  executeUnsubscribe,
} from "../services/brands.js";

/**
 * Enrolled Brands routes.
 *   GET  /brands                 the ledger with derived deals/savings counts
 *   POST /brands/:id/pause       stop surfacing (reversible)
 *   POST /brands/:id/reenroll    resume surfacing
 *   POST /brands/:id/unsubscribe real RFC 8058 unsubscribe + stop extraction
 *
 * No dark patterns: each control is one call, plainly named (ENROLLED_BRANDS_PRD §5.3).
 */
export async function brandRoutes(app: FastifyInstance): Promise<void> {
  app.get("/brands", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const brands = await listBrands(req.user!.id);
    return reply.send({ brands });
  });

  app.post("/brands/:id/pause", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const brand = await setBrandStatus(req.user!.id, id, "paused");
    if (!brand) return reply.code(404).send({ error: "Brand not found" });
    return reply.send({ brand });
  });

  app.post("/brands/:id/reenroll", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const brand = await setBrandStatus(req.user!.id, id, "active");
    if (!brand) return reply.code(404).send({ error: "Brand not found" });
    return reply.send({ brand });
  });

  app.post("/brands/:id/unsubscribe", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await executeUnsubscribe(req.user!.id, id);
    if (!result) return reply.code(404).send({ error: "Brand not found" });
    return reply.send({
      brand: result.brand,
      unsubscribed: true,
      method: result.method,
      sent: result.sent,
    });
  });
}
