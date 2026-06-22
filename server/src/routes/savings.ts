import type { FastifyInstance } from "fastify";
import { requireUser } from "../auth/middleware.js";
import { getSavingsSummary } from "../services/savings.js";

/**
 * Savings routes (Phase 2).
 *   GET /me/savings   surfaced / redeemed / available + cumulative + recent
 */
export async function savingsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/savings", { preHandler: requireUser }, async (req, reply) => {
    const savings = await getSavingsSummary(req.user!.id);
    return reply.send({ savings });
  });
}
