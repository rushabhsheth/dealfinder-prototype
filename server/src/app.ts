import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./auth/routes.js";
import { connectionRoutes } from "./routes/connections.js";
import { scanRoutes } from "./routes/scans.js";
import { offerRoutes } from "./routes/offers.js";
import { brandRoutes } from "./routes/brands.js";
import { savingsRoutes } from "./routes/savings.js";
import { entitlementRoutes } from "./routes/entitlements.js";

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
  await app.register(connectionRoutes);
  await app.register(scanRoutes);
  await app.register(offerRoutes);
  await app.register(brandRoutes);
  await app.register(savingsRoutes);
  await app.register(entitlementRoutes);

  return app;
}
