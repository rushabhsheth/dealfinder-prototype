import { adminDb } from "../db/supabase.js";
import type { EntitlementTier } from "../types/domain.js";

/**
 * Entitlement lifecycle (MONETIZATION_PRD.md §3/§7). One row per user gates every
 * premium capability (scan, offers, brands). Trial expiry WITHOUT conversion is
 * applied lazily on read: the first request after `trial_ends_at` flips the user
 * to free + downgraded (the graceful downgrade, PRD §4.3) and pauses scanning.
 *
 * No payout/billing logic here beyond a mock period end — real Stripe wiring is a
 * later phase; the shape is stable so it swaps in without touching callers.
 */

const TRIAL_LENGTH_DAYS = 14;
const DAY_MS = 86_400_000;

export interface EntitlementView {
  tier: EntitlementTier;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  downgraded: boolean;
  isPremium: boolean;
  /** Days left in the trial (0 once expired / not on trial). */
  trialDaysLeft: number;
}

export interface EntitlementRow {
  tier: EntitlementTier;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  downgraded: boolean;
}

/** True when a trial row has passed its end date (drives the lazy downgrade). */
export function isTrialExpired(row: EntitlementRow, now: number): boolean {
  return (
    row.tier === "trial" &&
    Boolean(row.trial_ends_at) &&
    new Date(row.trial_ends_at as string).getTime() <= now
  );
}

export function toView(row: EntitlementRow, now: number): EntitlementView {
  const isPremium = row.tier === "trial" || row.tier === "paid";
  let trialDaysLeft = 0;
  if (row.tier === "trial" && row.trial_ends_at) {
    trialDaysLeft = Math.max(0, Math.ceil((new Date(row.trial_ends_at).getTime() - now) / DAY_MS));
  }
  return {
    tier: row.tier,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    downgraded: row.downgraded,
    isPremium,
    trialDaysLeft,
  };
}

const SELECT = "tier, trial_started_at, trial_ends_at, downgraded";

/** Read the entitlement, applying lazy trial-expiry downgrade if due. */
export async function getEntitlement(
  userId: string,
  now: number = Date.now(),
): Promise<EntitlementView> {
  const { data, error } = await adminDb
    .from("entitlements")
    .select(SELECT)
    .eq("user_id", userId)
    .limit(1);
  if (error) throw new Error(error.message);

  // The auth trigger creates a default 'free' row; tolerate its absence anyway.
  let row =
    (data?.[0] as EntitlementRow | undefined) ?? {
      tier: "free" as EntitlementTier,
      trial_started_at: null,
      trial_ends_at: null,
      downgraded: false,
    };

  if (isTrialExpired(row, now)) {
    row = await applyDowngrade(userId);
  }
  return toView(row, now);
}

async function applyDowngrade(userId: string): Promise<EntitlementRow> {
  const { data, error } = await adminDb
    .from("entitlements")
    .update({ tier: "free", downgraded: true })
    .eq("user_id", userId)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as EntitlementRow;
}

async function setEntitlement(
  userId: string,
  patch: Partial<EntitlementRow>,
): Promise<EntitlementView> {
  const { data, error } = await adminDb
    .from("entitlements")
    .update(patch)
    .eq("user_id", userId)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return toView(data as EntitlementRow, Date.now());
}

/** Begin the 14-day trial (idempotent-ish: resets the window each call). */
export async function startTrial(userId: string): Promise<EntitlementView> {
  const now = Date.now();
  return setEntitlement(userId, {
    tier: "trial",
    trial_started_at: new Date(now).toISOString(),
    trial_ends_at: new Date(now + TRIAL_LENGTH_DAYS * DAY_MS).toISOString(),
    downgraded: false,
  });
}

/** Convert to paid (mock checkout — real billing is a later phase). */
export async function subscribe(userId: string): Promise<EntitlementView> {
  return setEntitlement(userId, { tier: "paid", downgraded: false });
}

/** Decline/cancel → graceful downgrade to free. */
export async function downgrade(userId: string): Promise<EntitlementView> {
  return setEntitlement(userId, { tier: "free", downgraded: true });
}
