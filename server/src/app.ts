import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./auth/routes.js";

/**
 * Build (but don't start) the Fastify app. Kept separate from index.ts so tests
 * can construct an instance without binding a port.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.isProd ? "info" : "debug",
      // Never log auth headers or token material.
      redact: ["req.headers.authorization"],
    },
    trustProxy: true,
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  // Phase 1+ route groups (Gmail connect, brands, offers, savings) register here.

  return app;
}
