// Provide harmless defaults so importing config.ts (which validates env at load)
// never needs real secrets in unit tests. dotenv won't override anything already
// set here, and nothing in these tests makes a network call.
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-key";
process.env.TOKEN_ENCRYPTION_KEY ||= Buffer.alloc(32).toString("base64");
process.env.ANTHROPIC_API_KEY ||= "test-anthropic-key";
