import { config } from "../config.js";

/**
 * Google OAuth 2.0 — read-only Gmail connect.
 *
 * HARD RULE (CLAUDE.WEBAPP.md §1): we request ONLY `gmail.readonly` (plus
 * `openid email` to identify the account). No write/send/modify scope is ever
 * requested, and `assertReadOnlyScopes` rejects a grant that somehow contains one.
 *
 * Implemented with plain fetch against Google's OAuth endpoints — no googleapis
 * SDK needed for the handshake. The Gmail *data* calls (Phase 2) can add a
 * client later.
 */

export const GMAIL_READONLY = "https://www.googleapis.com/auth/gmail.readonly";
const REQUESTED_SCOPES = ["openid", "email", GMAIL_READONLY];

// Any scope granting more than read is forbidden — belt and suspenders.
const FORBIDDEN_SCOPE_MARKERS = [
  "gmail.modify",
  "gmail.send",
  "gmail.compose",
  "gmail.insert",
  "gmail.settings",
  "mail.google.com", // full mailbox access
];

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number;
  scope: string;
}

export interface GoogleAccount {
  sub: string;
  email: string;
}

function requireCreds(): { clientId: string; clientSecret: string; redirectUri: string } {
  const { clientId, clientSecret, redirectUri } = config.google;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_* env missing)");
  }
  return { clientId, clientSecret, redirectUri };
}

/** Build the consent URL the user is redirected to. `state` carries our CSRF/user token. */
export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireCreds();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: REQUESTED_SCOPES.join(" "),
    access_type: "offline", // we want a refresh token
    prompt: "consent", // force refresh-token issuance on reconnect
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Exchange an authorization code for tokens. */
export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = requireCreds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresInSeconds: json.expires_in,
    scope: json.scope,
  };
}

/** Mint a fresh access token from a stored refresh token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<Omit<GoogleTokens, "refreshToken">> {
  const { clientId, clientSecret } = requireCreds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
  };
  return {
    accessToken: json.access_token,
    expiresInSeconds: json.expires_in,
    scope: json.scope,
  };
}

/** Identify the connected account (sub + email) using the access token. */
export async function getAccount(accessToken: string): Promise<GoogleAccount> {
  const res = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Userinfo failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { sub: string; email: string };
  return { sub: json.sub, email: json.email };
}

/** Revoke a token at Google (used on disconnect). Best-effort; never throws. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch {
    // Revocation is best-effort: if Google is unreachable we still purge locally.
  }
}

/**
 * Reject a grant that includes any write-capable scope, or that is missing the
 * read scope we need. Returns the granted scope list on success.
 */
export function assertReadOnlyScopes(scope: string): string[] {
  const granted = scope.split(/\s+/).filter(Boolean);
  const offending = granted.filter((s) =>
    FORBIDDEN_SCOPE_MARKERS.some((bad) => s.includes(bad)),
  );
  if (offending.length > 0) {
    throw new Error(`Refusing write-capable scopes: ${offending.join(", ")}`);
  }
  if (!granted.includes(GMAIL_READONLY)) {
    throw new Error("gmail.readonly was not granted");
  }
  return granted;
}
