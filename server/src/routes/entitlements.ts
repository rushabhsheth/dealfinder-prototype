import type { FastifyInstance } from "fastify";
import { requireUser } from "../auth/middleware.js";
import {
  getEntitlement,
  startTrial,
  subscribe,
  downgrade,
} from "../services/entitlements.js";

/**
 * Entitlement lifecycle routes (MONETIZATION_PRD.md).
 *   GET  /me/entitlement            current tier (applies lazy trial-expiry)
 *   POST /me/entitlement/trial      start the 14-day trial
 *   POST /me/entitlement/subscribe  convert to paid (mock checkout)
 *   POST /me/entitlement/cancel     graceful downgrade to free
 *
 * The frontend derives `tier`/`downgraded`/`isPremium` from these so gating is
 * server-authoritative, while the demo's DemoContext maps onto the same actions.
 */
export async function entitlementRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/entitlement", { preHandler: requireUser }, async (req, reply) => {
    return reply.send({ entitlement: await getEntitlement(req.user!.id) });
  });

  app.post("/me/entitlement/trial", { preHandler: requireUser }, async (req, reply) => {
    return reply.send({ entitlement: await startTrial(req.user!.id) });
  });

  app.post("/me/entitlement/subscribe", { preHandler: requireUser }, async (req, reply) => {
    return reply.send({ entitlement: await subscribe(req.user!.id) });
  });

  app.post("/me/entitlement/cancel", { preHandler: requireUser }, async (req, reply) => {
    return reply.send({ entitlement: await downgrade(req.user!.id) });
  });
}
