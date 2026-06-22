import "dotenv/config";
import { z } from "zod";

/**
 * Typed, validated configuration loaded from environment variables.
 *
 * `dotenv/config` (imported first) loads server/.env in dev. In production the
 * host's secret store populates the environment instead — .env is git-ignored.
 * Secrets live ONLY in the environment, never in the repo or in client code.
 * Importing this module validates the env up front and fails fast with a clear
 * message if a required value is missing or malformed.
 */

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Where the frontend lives — OAuth callbacks redirect the browser back here.
  APP_BASE_URL: z.string().url().default("http://localhost:5173"),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AES-256-GCM key for OAuth-token encryption: 32 bytes, base64-encoded.
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(1, "TOKEN_ENCRYPTION_KEY is required")
    .refine(
      (v) => Buffer.from(v, "base64").length === 32,
      "TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded (run: npm run gen:key)",
    ),

  // Google OAuth — Phase 1. Optional now so the server boots before we wire Gmail.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),

  // Anthropic — Phase 2 extraction. Optional now.
  ANTHROPIC_API_KEY: z.string().optional(),
  // Swappable extraction model (Haiku is cheap at scan volume; Sonnet for quality).
  ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5-20251001"),

  // Scan bounds (first scan). Configurable so cost/latency can be tuned.
  SCAN_MAX_MESSAGES: z.coerce.number().int().positive().default(120),
  SCAN_LOOKBACK_DAYS: z.coerce.number().int().positive().default(90),
});

export type AppConfig = Readonly<{
  nodeEnv: "development" | "test" | "production";
  isProd: boolean;
  port: number;
  corsOrigins: string[];
  appBaseUrl: string;
  supabase: { url: string; anonKey: string; serviceRoleKey: string };
  tokenEncryptionKey: Buffer;
  google: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  };
  anthropicApiKey?: string;
  anthropicModel: string;
  scan: { maxMessages: number; lookbackDays: number };
}>;

function load(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    // Fail fast — do not boot with an invalid/partial config.
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  const env = parsed.data;
  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    isProd: env.NODE_ENV === "production",
    port: env.PORT,
    corsOrigins: env.CORS_ORIGIN.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    appBaseUrl: env.APP_BASE_URL,
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    tokenEncryptionKey: Buffer.from(env.TOKEN_ENCRYPTION_KEY, "base64"),
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI,
    },
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicModel: env.ANTHROPIC_MODEL,
    scan: {
      maxMessages: env.SCAN_MAX_MESSAGES,
      lookbackDays: env.SCAN_LOOKBACK_DAYS,
    },
  });
}

export const config: AppConfig = load();

/** True once Google OAuth credentials are present (required for Phase 1 connect). */
export function googleConfigured(): boolean {
  return Boolean(
    config.google.clientId &&
      config.google.clientSecret &&
      config.google.redirectUri,
  );
}

/** True once the Anthropic key is present (required for Phase 2 extraction). */
export function anthropicConfigured(): boolean {
  return Boolean(config.anthropicApiKey);
}
