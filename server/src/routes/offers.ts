import type { FastifyInstance } from "fastify";
import { requireUser, requirePremium } from "../auth/middleware.js";
import {
  listRankedOffers,
  getOffer,
  recordRedemption,
} from "../services/offers.js";

/**
 * Offer routes (Phase 2).
 *   GET  /offers            payout-blind ranked feed
 *   GET  /offers/:id        deal detail
 *   POST /offers/:id/redeem record a redemption → savings ledger
 */
export async function offerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/offers", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const offers = await listRankedOffers(req.user!.id);
    return reply.send({ offers });
  });

  app.get("/offers/:id", { preHandler: [requireUser, requirePremium] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const offer = await getOffer(req.user!.id, id);
    if (!offer) return reply.code(404).send({ error: "Offer not found" });
    return reply.send({ offer });
  });

  app.post(
    "/offers/:id/redeem",
    { preHandler: [requireUser, requirePremium] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const result = await recordRedemption(req.user!.id, id);
      if (!result) return reply.code(404).send({ error: "Offer not found" });
      return reply.send({ redeemed: true, saved: result.saved });
    },
  );
}
