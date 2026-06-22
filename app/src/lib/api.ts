/**
 * API client for the real backend (server/). The mock prototype has no backend,
 * so everything here is gated on `VITE_API_BASE`: when it's unset the app runs
 * in pure-demo mode and screens keep using mock JSON. When it's set, premium
 * surfaces talk to the real API.
 *
 * Keep this the ONLY place the frontend knows the API shape.
 */

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "");

/** True when a real backend is configured — flips screens from mock to live. */
export const backendEnabled = Boolean(API_BASE);

const TOKEN_KEY = "df.accessToken";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function isSignedIn(): boolean {
  return Boolean(getToken());
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new ApiError(0, "Backend not configured");
  const token = getToken();
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
interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { session } = await request<{ session: Session }>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(session.accessToken);
}

export async function signUp(email: string, password: string): Promise<void> {
  const { session } = await request<{ session: Session | null }>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
  // If email confirmation is on there's no session; the caller then signs in.
  if (session) setToken(session.accessToken);
}

export function signOut(): void {
  setToken(null);
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

/** Returns the Google consent URL to send the browser to. */
export function startGoogleConnect(): Promise<{ authorizeUrl: string }> {
  return request("/connections/google/start", { method: "POST" });
}

export function disconnectInbox(id: string): Promise<{ disconnected: boolean }> {
  return request(`/connections/${id}/disconnect`, { method: "POST" });
}
