import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authClient, adminDb } from "../db/supabase.js";
import { requireUser } from "./middleware.js";
import type { Entitlement } from "../types/domain.js";

/**
 * Minimal real auth backed by Supabase Auth (email + password).
 *
 *   POST /auth/signup  → creates an auth.users row (DB trigger mirrors it into
 *                        public.users + a default 'free' entitlement), returns a session.
 *   POST /auth/signin  → returns a session (access + refresh token).
 *   GET  /auth/me      → the authed user + their entitlement (requires bearer token).
 *
 * The frontend stores the returned access token and sends it as
 * `Authorization: Bearer <token>` on subsequent calls. We deliberately keep the
 * password handshake on the server so the client never touches the service-role
 * key; Supabase owns password hashing and session issuance.
 */

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function sessionPayload(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/signup", async (req, reply) => {
    const parsed = CredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message });
    }
    const { email, password } = parsed.data;

    const { data, error } = await authClient.auth.signUp({ email, password });
    if (error) {
      return reply.code(400).send({ error: error.message });
    }
    // If email confirmation is enabled there may be no session yet.
    return reply.code(201).send({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session ? sessionPayload(data.session) : null,
    });
  });

  app.post("/auth/signin", async (req, reply) => {
    const parsed = CredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message });
    }
    const { email, password } = parsed.data;

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      return reply.code(401).send({ error: error?.message ?? "Sign-in failed" });
    }
    return reply.send({
      user: { id: data.user.id, email: data.user.email },
      session: sessionPayload(data.session),
    });
  });

  app.get("/auth/me", { preHandler: requireUser }, async (req, reply) => {
    const user = req.user!; // requireUser guarantees this

    // Read the entitlement via the service role (RLS-exempt, server-trusted).
    const { data, error } = await adminDb
      .from("entitlements")
      .select("tier, trial_started_at, trial_ends_at, downgraded")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return reply.code(500).send({ error: "Failed to load entitlement" });
    }

    const entitlement: Entitlement = {
      tier: data?.tier ?? "free",
      trialStartedAt: data?.trial_started_at ?? null,
      trialEndsAt: data?.trial_ends_at ?? null,
      downgraded: data?.downgraded ?? false,
    };

    return reply.send({ user, entitlement });
  });
}
