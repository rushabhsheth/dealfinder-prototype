import type { FastifyInstance } from "fastify";
import { config, googleConfigured } from "../config.js";
import { requireUser } from "../auth/middleware.js";
import { buildAuthUrl } from "../services/google.js";
import { createOAuthState, verifyOAuthState } from "../services/oauthState.js";
import {
  listConnections,
  completeGoogleConnect,
  disconnectAndPurge,
} from "../services/connections.js";

/**
 * Inbox-connection routes (Phase 1 — read-only Gmail).
 *
 *   GET  /connections                  list the user's connections (no tokens)
 *   POST /connections/google/start     → { authorizeUrl } to send the user to Google
 *   GET  /connections/google/callback  Google redirects here; we store + redirect to app
 *   POST /connections/:id/disconnect   revoke at Google + purge derived data
 *
 * The callback is the only unauthenticated route — the user is identified from
 * the signed/encrypted `state`, not a bearer token (it's a top-level redirect).
 */
export async function connectionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/connections", { preHandler: requireUser }, async (req, reply) => {
    const connections = await listConnections(req.user!.id);
    return reply.send({ connections });
  });

  app.post(
    "/connections/google/start",
    { preHandler: requireUser },
    async (req, reply) => {
      if (!googleConfigured()) {
        return reply
          .code(503)
          .send({ error: "Google OAuth is not configured on the server" });
      }
      const state = createOAuthState(req.user!.id);
      return reply.send({ authorizeUrl: buildAuthUrl(state) });
    },
  );

  app.get("/connections/google/callback", async (req, reply) => {
    const query = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    const back = (status: string, detail?: string) => {
      const url = new URL("/connect/callback", config.appBaseUrl);
      url.searchParams.set("status", status);
      if (detail) url.searchParams.set("reason", detail);
      return reply.redirect(url.toString());
    };

    if (query.error) return back("error", query.error);
    if (!query.code || !query.state) return back("error", "missing_code");

    let userId: string;
    try {
      ({ userId } = verifyOAuthState(query.state));
    } catch {
      return back("error", "bad_state");
    }

    try {
      await completeGoogleConnect(userId, query.code);
      return back("success");
    } catch (err) {
      req.log.error({ err }, "google connect failed");
      // assertReadOnlyScopes throwing lands here too — surface a clear reason.
      const reason =
        err instanceof Error && err.message.includes("scope")
          ? "scope_denied"
          : "connect_failed";
      return back("error", reason);
    }
  });

  app.post(
    "/connections/:id/disconnect",
    { preHandler: requireUser },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const ok = await disconnectAndPurge(req.user!.id, id);
      if (!ok) return reply.code(404).send({ error: "Connection not found" });
      return reply.send({ disconnected: true });
    },
  );
}
