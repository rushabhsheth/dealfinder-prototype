import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";

/**
 * Vercel serverless entry for the Fastify backend.
 *
 * Vercel doesn't run a long-lived `listen()` server, so instead of binding a
 * port we hand each incoming request to Fastify's HTTP server via
 * `server.emit("request", …)`. The built app is cached across warm invocations.
 *
 * `server/vercel.json` rewrites every path to this one function, so Fastify sees
 * the original URL and does its own routing.
 *
 * NOTE: we use raw Node req/res types (not @vercel/node's helpers) on purpose —
 * touching `req.body` would consume the stream before Fastify parses it. If a
 * future change reads `req.body` here, POST bodies will hang; don't.
 *
 * Phase 2's background scan worker is long-running and does NOT belong in a
 * serverless function — it'll run via Vercel Cron + a queue, or a separate
 * worker host. See DEPLOY.md.
 */

const ready = buildApp().then(async (app) => {
  await app.ready();
  return app;
});

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await ready;
  app.server.emit("request", req, res);
}
