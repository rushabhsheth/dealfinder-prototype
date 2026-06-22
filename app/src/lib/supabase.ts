import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client — AUTH ONLY (Continue with Google + email/password).
 *
 * The anon key is designed for the browser; RLS protects the data, and inbox
 * access never happens client-side (that's the server's job). We use this client
 * purely to obtain a Supabase session; every data call still goes through our
 * own API with the session's bearer token.
 *
 * Null when the env isn't configured (pure-demo mode), so callers must guard.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // completes the OAuth redirect automatically
          flowType: "pkce",
        },
      })
    : null;

/** True when Supabase auth (incl. Google sign-in) is available. */
export const supabaseAuthEnabled = supabase !== null;
