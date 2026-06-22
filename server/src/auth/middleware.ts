import type { FastifyReply, FastifyRequest } from "fastify";
import { authClient } from "../db/supabase.js";
import { getEntitlement } from "../services/entitlements.js";
import type { AuthedUser } from "../types/domain.js";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `requireUser` once a valid bearer token is verified. */
    user?: AuthedUser;
  }
}

function bearerFrom(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!token || scheme?.toLowerCase() !== "bearer") return null;
  return token.trim();
}

/**
 * Fastify preHandler that authenticates a request from a Supabase access token.
 *
 * Flow: pull the `Authorization: Bearer <jwt>`, verify it with Supabase
 * (`auth.getUser`), and attach `{ id, email }` to `request.user`. Verification
 * is delegated to Supabase rather than decoding the JWT ourselves, so a revoked
 * session is rejected immediately. Returns 401 on any failure.
 */
export async function requireUser(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = bearerFrom(req);
  if (!token) {
    await reply.code(401).send({ error: "Missing bearer token" });
    return;
  }

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    await reply.code(401).send({ error: "Invalid or expired session" });
    return;
  }

  req.user = { id: data.user.id, email: data.user.email ?? "" };
}

/**
 * Gate a route on an active premium entitlement (trial or paid). Runs AFTER
 * `requireUser`. Trial-expiry is applied lazily inside getEntitlement, so an
 * expired trial is treated as free here and rejected with 402 — the frontend
 * reads that as "show the locked/paywall state", not an error.
 */
export async function requirePremium(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!req.user) {
    await reply.code(401).send({ error: "Not authenticated" });
    return;
  }
  const ent = await getEntitlement(req.user.id);
  if (!ent.isPremium) {
    await reply.code(402).send({ error: "premium_required" });
    return;
  }
}
