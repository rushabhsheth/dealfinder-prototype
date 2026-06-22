/**
 * API client for the real backend (server/). The mock prototype has no backend,
 * so data calls are gated on `VITE_API_BASE`: unset → pure-demo/mock mode.
 *
 * Auth goes through Supabase (lib/supabase.ts) when configured — that's what
 * powers "Continue with Google" and email/password — and the resulting session's
 * access token is sent as the bearer on every backend call. When Supabase isn't
 * configured we fall back to the server's own email/password endpoints.
 *
 * Keep this the ONLY place the frontend knows the API shape.
 */

import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "");

/** True when a real backend is configured — flips screens from mock to live. */
export const backendEnabled = Boolean(API_BASE);

// Legacy bearer store, used only when Supabase auth isn't configured.
const TOKEN_KEY = "df.accessToken";
// Stash the post-login destination across the Google redirect.
const NEXT_KEY = "df.authNext";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The current bearer token: Supabase session first, then legacy fallback. */
async function currentAccessToken(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function isSignedIn(): Promise<boolean> {
  return Boolean(await currentAccessToken());
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new ApiError(0, "Backend not configured");
  const token = await currentAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(res.status, (body.error as string) ?? res.statusText);
  }
  return body as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────
interface LegacySession {
  accessToken: string;
}

/**
 * Continue with Google (identity only — openid/email/profile). Redirects the
 * browser to Google via Supabase; control returns to /auth/callback. This is
 * distinct from connecting Gmail (gmail.readonly), which stays its own consent.
 */
export async function signInWithGoogle(next?: string): Promise<void> {
  if (!supabase) throw new ApiError(0, "Google sign-in is not configured");
  if (next) sessionStorage.setItem(NEXT_KEY, next);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new ApiError(0, error.message);
  // The browser navigates to Google here; nothing after this runs.
}

export async function signIn(email: string, password: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(401, error.message);
    return;
  }
  const { session } = await request<{ session: LegacySession }>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(TOKEN_KEY, session.accessToken);
}

export async function signUp(email: string, password: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new ApiError(400, error.message);
    return;
  }
  const { session } = await request<{ session: LegacySession | null }>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
  if (session) localStorage.setItem(TOKEN_KEY, session.accessToken);
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(TOKEN_KEY);
}

/** Read & clear the destination saved before a Google redirect. */
export function takeAuthNext(): string | null {
  const n = sessionStorage.getItem(NEXT_KEY);
  if (n) sessionStorage.removeItem(NEXT_KEY);
  return n;
}

// ── Inbox connections (Phase 1) ──────────────────────────────────────────────
export interface InboxConnection {
  id: string;
  provider: "google";
  accountEmail: string | null;
  scopes: string[];
  status: "active" | "revoked";
  connectedAt: string;
  lastSyncedAt: string | null;
}

export function listConnections(): Promise<{ connections: InboxConnection[] }> {
  return request("/connections");
}

/** Returns the Google consent URL (gmail.readonly) to send the browser to. */
export function startGoogleConnect(): Promise<{ authorizeUrl: string }> {
  return request("/connections/google/start", { method: "POST" });
}

export function disconnectInbox(id: string): Promise<{ disconnected: boolean }> {
  return request(`/connections/${id}/disconnect`, { method: "POST" });
}
