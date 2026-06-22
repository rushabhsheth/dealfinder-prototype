import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { config } from "../config.js";

/**
 * supabase-js eagerly constructs a Realtime client, which needs a global
 * WebSocket. Node < 22 has none, so we hand it the `ws` implementation. We never
 * actually open realtime channels — this just stops the constructor from
 * throwing on import. (Native WebSocket on Node 22+ would make this unnecessary.)
 *
 * `ws` and Supabase's `WebSocketLikeConstructor` have slightly different
 * constructor signatures, so we bridge the interop boundary with a cast to the
 * exact transport type derived from createClient's own options.
 */
type RealtimeOpts = NonNullable<Parameters<typeof createClient>[2]>["realtime"];
const realtime: RealtimeOpts = {
  transport: WebSocket as unknown as NonNullable<RealtimeOpts>["transport"],
};

/**
 * Two Supabase clients, used deliberately:
 *
 * 1. `adminDb` — authenticated with the SERVICE-ROLE key. Bypasses Row-Level
 *    Security; full read/write. Server-only. Used by trusted backend code
 *    (auth provisioning, the scan worker writing offers, token storage).
 *    The service-role key must NEVER reach the browser.
 *
 * 2. `authClient` — authenticated with the ANON key. Used only to verify a
 *    user's bearer JWT (`auth.getUser(jwt)`) and for auth operations
 *    (sign-up / sign-in). Subject to RLS, like a normal client.
 *
 * RLS is still defined on every table (see migrations) as defense-in-depth:
 * even though the backend mostly uses the service role, the policies mean a
 * leaked anon key can only ever read a user's own rows.
 */

export const adminDb: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime,
  },
);

export const authClient: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime,
  },
);
