import { buildApp } from "./app.js";
import { config } from "./config.js";

/**
 * Process entry point. Validates config on import (see config.ts), builds the
 * app, and listens. Handles graceful shutdown on SIGINT/SIGTERM.
 */
async function main(): Promise<void> {
  const app = await buildApp();

  const close = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void close("SIGINT"));
  process.on("SIGTERM", () => void close("SIGTERM"));

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err, "failed to start");
    process.exit(1);
  }
}

void main();
