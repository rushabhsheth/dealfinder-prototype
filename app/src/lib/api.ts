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
import type { Deal, EnrolledBrand } from "../types";

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
      // Only declare a JSON body when there is one — bodyless POSTs (connect,
      // disconnect) must NOT send content-type: application/json, or Fastify
      // rejects them with FST_ERR_CTP_EMPTY_JSON_BODY.
      ...(init.body ? { "content-type": "application/json" } : {}),
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

/**
 * Whether the signed-in user already has a connected inbox — used to route
 * returning users straight to their feed instead of back through connect + scan.
 * Resolves false (rather than throwing) when signed out or on error.
 */
export async function hasActiveInbox(): Promise<boolean> {
  try {
    const { connections } = await listConnections();
    return connections.some((c) => c.status === "active");
  } catch {
    return false;
  }
}

/** Returns the Google consent URL (gmail.readonly) to send the browser to. */
export function startGoogleConnect(): Promise<{ authorizeUrl: string }> {
  return request("/connections/google/start", { method: "POST" });
}

export function disconnectInbox(id: string): Promise<{ disconnected: boolean }> {
  return request(`/connections/${id}/disconnect`, { method: "POST" });
}

// ── Scan, offers, brands, savings (Phase 2) ──────────────────────────────────

export interface ScanProgress {
  id: string;
  status: "queued" | "running" | "done" | "error";
  messagesScanned: number;
  offersFound: number;
  foundTotal: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ScanPreferences {
  categories: string[];
  brands: string[];
}

/** Kick off an async inbox scan. Pass the user's personalization seeds for fit. */
export function startScan(
  preferences?: ScanPreferences,
): Promise<{ scanId: string }> {
  return request("/scans", {
    method: "POST",
    body: JSON.stringify({ preferences }),
  });
}

export function getScan(id: string): Promise<{ scan: ScanProgress }> {
  return request(`/scans/${id}`);
}

/** The personalized feed — already ranked payout-blind server-side. */
export function getOffers(): Promise<{ offers: Deal[] }> {
  return request("/offers");
}

export function getOffer(id: string): Promise<{ offer: Deal }> {
  return request(`/offers/${id}`);
}

export function redeemOffer(id: string): Promise<{ redeemed: boolean; saved: number }> {
  return request(`/offers/${id}/redeem`, { method: "POST" });
}

export function getBrands(): Promise<{ brands: EnrolledBrand[] }> {
  return request("/brands");
}

export interface SavingsResponse {
  surfaced: number;
  redeemed: number;
  available: number;
  cumulative: {
    totalSaved: number;
    surfacedValue: number;
    availableValue: number;
    dealsRedeemed: number;
    offersSurfaced: number;
    messagesScanned: number;
    averageSavingPercent: number;
    byCategory: { category: Deal["category"]; saved: number }[];
    timeline: { date: string; total: number }[];
  };
  recent: { dealId: string | null; brand: string; saved: number; redeemedAt: string }[];
}

export function getSavings(): Promise<{ savings: SavingsResponse }> {
  return request("/me/savings");
}

// ── Enrolled Brands controls (Phase C) ───────────────────────────────────────
export function pauseBrand(id: string): Promise<{ brand: EnrolledBrand }> {
  return request(`/brands/${id}/pause`, { method: "POST" });
}

export function unsubscribeBrand(id: string): Promise<{
  brand: EnrolledBrand;
  unsubscribed: boolean;
  /** How it was executed: real one-click POST, a mailto we can't auto-send, or none. */
  method: "http" | "mailto" | "none";
  /** True only when a standardized unsubscribe was actually sent. */
  sent: boolean;
}> {
  return request(`/brands/${id}/unsubscribe`, { method: "POST" });
}

export function reenrollBrand(id: string): Promise<{ brand: EnrolledBrand }> {
  return request(`/brands/${id}/reenroll`, { method: "POST" });
}

// ── Entitlements (Phase D) ───────────────────────────────────────────────────
export interface Entitlement {
  tier: "free" | "trial" | "paid";
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  downgraded: boolean;
  isPremium: boolean;
  trialDaysLeft: number;
}

export function getEntitlement(): Promise<{ entitlement: Entitlement }> {
  return request("/me/entitlement");
}

export function startTrial(): Promise<{ entitlement: Entitlement }> {
  return request("/me/entitlement/trial", { method: "POST" });
}

export function subscribePlan(): Promise<{ entitlement: Entitlement }> {
  return request("/me/entitlement/subscribe", { method: "POST" });
}

export function cancelPlan(): Promise<{ entitlement: Entitlement }> {
  return request("/me/entitlement/cancel", { method: "POST" });
}
