import { adminDb } from "../db/supabase.js";
import { encryptSecret, decryptSecret } from "../crypto/tokens.js";
import {
  exchangeCode,
  getAccount,
  assertReadOnlyScopes,
  refreshAccessToken,
  revokeToken,
  type GoogleTokens,
} from "./google.js";
import type { InboxConnection } from "../types/domain.js";

/**
 * Inbox-connection lifecycle, server-side only. Tokens are encrypted before they
 * ever touch the database (see crypto/tokens.ts) and never leave the server.
 * All writes use the service-role client (RLS-exempt, trusted backend).
 */

interface ConnectionRow {
  id: string;
  provider: "google";
  provider_account_email: string | null;
  scopes: string[];
  status: "active" | "revoked";
  connected_at: string;
  last_synced_at: string | null;
}

const PUBLIC_COLUMNS =
  "id, provider, provider_account_email, scopes, status, connected_at, last_synced_at";

function toPublic(row: ConnectionRow): InboxConnection {
  return {
    id: row.id,
    provider: row.provider,
    accountEmail: row.provider_account_email,
    scopes: row.scopes,
    status: row.status,
    connectedAt: row.connected_at,
    lastSyncedAt: row.last_synced_at,
  };
}

/** List a user's connections — tokens are intentionally never selected. */
export async function listConnections(userId: string): Promise<InboxConnection[]> {
  const { data, error } = await adminDb
    .from("oauth_connections")
    .select(PUBLIC_COLUMNS)
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ConnectionRow[]).map(toPublic);
}

/**
 * Finish the OAuth handshake: exchange the code, verify the granted scopes are
 * read-only, identify the account, encrypt the tokens, and upsert the
 * connection row. Returns the public (token-free) connection.
 */
export async function completeGoogleConnect(
  userId: string,
  code: string,
): Promise<InboxConnection> {
  const tokens: GoogleTokens = await exchangeCode(code);
  const grantedScopes = assertReadOnlyScopes(tokens.scope); // throws on write scopes
  const account = await getAccount(tokens.accessToken);

  const expiresAt = new Date(
    Date.now() + tokens.expiresInSeconds * 1000,
  ).toISOString();

  const row = {
    user_id: userId,
    provider: "google" as const,
    provider_account_id: account.sub,
    provider_account_email: account.email,
    scopes: grantedScopes,
    access_token_ciphertext: encryptSecret(tokens.accessToken),
    // A reconnect may omit the refresh token; keep the existing one if so.
    refresh_token_ciphertext: tokens.refreshToken
      ? encryptSecret(tokens.refreshToken)
      : undefined,
    access_token_expires_at: expiresAt,
    status: "active" as const,
    connected_at: new Date().toISOString(),
    revoked_at: null,
  };

  const { data, error } = await adminDb
    .from("oauth_connections")
    .upsert(row, { onConflict: "user_id,provider,provider_account_id" })
    .select(PUBLIC_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toPublic(data as ConnectionRow);
}

/**
 * Disconnect: revoke the grant at Google, then PURGE the connection and every
 * derived record for this user (brands/offers/savings). Data minimization +
 * "disconnect must actually purge" (CLAUDE.WEBAPP.md §3). Returns false if the
 * connection isn't found / not owned by the user.
 */
export async function disconnectAndPurge(
  userId: string,
  connectionId: string,
): Promise<boolean> {
  const { data: rows, error: readErr } = await adminDb
    .from("oauth_connections")
    .select("id, access_token_ciphertext, refresh_token_ciphertext")
    .eq("user_id", userId)
    .eq("id", connectionId)
    .limit(1);
  if (readErr) throw new Error(readErr.message);
  const conn = rows?.[0];
  if (!conn) return false;

  // Best-effort revoke at Google (prefer the refresh token — revoking it kills
  // the whole grant). revokeToken never throws.
  const toRevoke = conn.refresh_token_ciphertext ?? conn.access_token_ciphertext;
  if (toRevoke) {
    try {
      await revokeToken(decryptSecret(toRevoke));
    } catch {
      // Corrupt ciphertext shouldn't block local purge.
    }
  }

  // Purge derived data first, then the connection. brands/offers/savings cascade
  // off user_id; here we clear everything inbox-derived for this user.
  await adminDb.from("savings").delete().eq("user_id", userId);
  await adminDb.from("offers").delete().eq("user_id", userId);
  await adminDb.from("brands").delete().eq("user_id", userId);
  const { error: delErr } = await adminDb
    .from("oauth_connections")
    .delete()
    .eq("user_id", userId)
    .eq("id", connectionId);
  if (delErr) throw new Error(delErr.message);

  return true;
}

// ── Access for the scan worker ────────────────────────────────────────────────

interface ConnectionWithTokens {
  id: string;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string | null;
  access_token_expires_at: string | null;
}

/** The user's active Google connection (with token ciphertext), or null. */
export async function getActiveGoogleConnection(
  userId: string,
): Promise<ConnectionWithTokens | null> {
  const { data, error } = await adminDb
    .from("oauth_connections")
    .select(
      "id, access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at",
    )
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("status", "active")
    .order("connected_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0] as ConnectionWithTokens) ?? null;
}

// Refresh a little early so a token doesn't expire mid-scan.
const TOKEN_REFRESH_SKEW_MS = 60_000;

/**
 * Return a usable access token for a connection, refreshing (and re-encrypting
 * the new access token at rest) when the stored one is expired or about to be.
 * Tokens never leave the server. Throws if the connection has no refresh token
 * and the access token is stale (the user must reconnect).
 */
export async function getFreshAccessToken(
  conn: ConnectionWithTokens,
): Promise<string> {
  const expiresAt = conn.access_token_expires_at
    ? new Date(conn.access_token_expires_at).getTime()
    : 0;
  const stillFresh = expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now();
  if (stillFresh && conn.access_token_ciphertext) {
    return decryptSecret(conn.access_token_ciphertext);
  }

  if (!conn.refresh_token_ciphertext) {
    throw new Error("Access token expired and no refresh token on file");
  }
  const refreshToken = decryptSecret(conn.refresh_token_ciphertext);
  const refreshed = await refreshAccessToken(refreshToken);
  // Re-assert read-only — a refresh should never widen scope, but verify.
  assertReadOnlyScopes(refreshed.scope);

  const newExpiry = new Date(
    Date.now() + refreshed.expiresInSeconds * 1000,
  ).toISOString();
  const { error } = await adminDb
    .from("oauth_connections")
    .update({
      access_token_ciphertext: encryptSecret(refreshed.accessToken),
      access_token_expires_at: newExpiry,
    })
    .eq("id", conn.id);
  if (error) throw new Error(error.message);

  return refreshed.accessToken;
}

/** Stamp a successful sync time on the connection (called after a scan). */
export async function markSynced(connectionId: string): Promise<void> {
  await adminDb
    .from("oauth_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", connectionId);
}
