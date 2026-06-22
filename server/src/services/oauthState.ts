import { randomBytes } from "node:crypto";
import { encryptSecret, decryptSecret } from "../crypto/tokens.js";

/**
 * Stateless OAuth `state` parameter — CSRF protection + user binding.
 *
 * The OAuth callback is a top-level browser redirect with no bearer token, so we
 * can't read the authed user from the request. Instead the (authenticated)
 * /start endpoint mints an ENCRYPTED state that carries the user id, a random
 * nonce, and an issued-at timestamp. On callback we decrypt it (which also
 * authenticates it — AES-GCM detects tampering) and check it hasn't expired.
 * No server-side state table needed.
 */

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface StatePayload {
  u: string; // user id
  n: string; // nonce
  iat: number; // issued-at (epoch ms)
}

export function createOAuthState(userId: string): string {
  const payload: StatePayload = {
    u: userId,
    n: randomBytes(16).toString("hex"),
    iat: Date.now(),
  };
  return encryptSecret(JSON.stringify(payload));
}

/** Returns the bound user id, or throws if the state is invalid/expired/tampered. */
export function verifyOAuthState(state: string): { userId: string } {
  let payload: StatePayload;
  try {
    payload = JSON.parse(decryptSecret(state)) as StatePayload;
  } catch {
    throw new Error("Invalid OAuth state");
  }
  if (!payload.u || typeof payload.iat !== "number") {
    throw new Error("Malformed OAuth state");
  }
  if (Date.now() - payload.iat > STATE_TTL_MS) {
    throw new Error("Expired OAuth state");
  }
  return { userId: payload.u };
}
