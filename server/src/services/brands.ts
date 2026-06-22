import { adminDb } from "../db/supabase.js";
import type { EnrolledBrand } from "../types/domain.js";

/**
 * The Enrolled Brands ledger (ENROLLED_BRANDS_PRD.md). One row per promo sender.
 * Per-brand counts (deals surfaced, $ saved, recent offers) are DERIVED from the
 * offers/savings tables so they're always consistent with the feed — we don't
 * hand-maintain duplicate counters.
 */

interface BrandRow {
  id: string;
  brand: string;
  brand_initials: string;
  logo_url: string | null;
  category: EnrolledBrand["category"];
  source: EnrolledBrand["source"];
  status: EnrolledBrand["status"];
  enrolled_at: string;
  enrolled_reason: string | null;
  sender_domain: string;
  emails_per_month: number;
  can_one_click_unsubscribe: boolean;
  last_offer_at: string | null;
}

export async function listBrands(userId: string): Promise<EnrolledBrand[]> {
  const [{ data: brands, error: bErr }, offers, savings] = await Promise.all([
    adminDb.from("brands").select("*").eq("user_id", userId),
    adminDb.from("offers").select("id, brand_id").eq("user_id", userId),
    adminDb.from("savings").select("brand_id, amount_saved").eq("user_id", userId),
  ]);
  if (bErr) throw new Error(bErr.message);

  const offerIdsByBrand = new Map<string, string[]>();
  for (const o of (offers.data ?? []) as { id: string; brand_id: string | null }[]) {
    if (!o.brand_id) continue;
    const list = offerIdsByBrand.get(o.brand_id) ?? [];
    list.push(o.id);
    offerIdsByBrand.set(o.brand_id, list);
  }

  const savedByBrand = new Map<string, number>();
  for (const s of (savings.data ?? []) as {
    brand_id: string | null;
    amount_saved: number | string;
  }[]) {
    if (!s.brand_id) continue;
    const amt = typeof s.amount_saved === "string" ? Number(s.amount_saved) : s.amount_saved;
    savedByBrand.set(s.brand_id, (savedByBrand.get(s.brand_id) ?? 0) + (amt || 0));
  }

  return (brands as BrandRow[]).map((row) => {
    const offerIds = offerIdsByBrand.get(row.id) ?? [];
    return {
      id: row.id,
      brand: row.brand,
      brandInitials: row.brand_initials,
      logoUrl: row.logo_url,
      category: row.category,
      source: row.source,
      status: row.status,
      enrolledAt: row.enrolled_at,
      enrolledReason: row.enrolled_reason,
      senderDomain: row.sender_domain,
      dealsSurfaced: offerIds.length,
      totalSaved: Math.round((savedByBrand.get(row.id) ?? 0) * 100) / 100,
      lastOfferAt: row.last_offer_at,
      emailsPerMonth: row.emails_per_month,
      canOneClickUnsubscribe: row.can_one_click_unsubscribe,
      offerDealIds: offerIds,
    };
  });
}

/** One brand (with derived counts), or null if not the user's. */
export async function getBrand(
  userId: string,
  id: string,
): Promise<EnrolledBrand | null> {
  const all = await listBrands(userId);
  return all.find((b) => b.id === id) ?? null;
}

/**
 * Set a brand's status (pause / re-enroll). The scan worker skips
 * non-active brands and the feed query hides their offers, so this is the single
 * lever for "stop/resume surfacing". Returns the updated brand, or null.
 */
export async function setBrandStatus(
  userId: string,
  id: string,
  status: EnrolledBrand["status"],
): Promise<EnrolledBrand | null> {
  const { data, error } = await adminDb
    .from("brands")
    .update({ status })
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .limit(1);
  if (error) throw new Error(error.message);
  if (!data?.[0]) return null;
  return getBrand(userId, id);
}

interface UnsubMethod {
  http?: string | null;
  mailto?: string | null;
}

export interface UnsubscribeResult {
  brand: EnrolledBrand;
  /** How we attempted it: a real one-click POST, a mailto we can't auto-send, or none. */
  method: "http" | "mailto" | "none";
  /** True only when we actually executed a standardized unsubscribe. */
  sent: boolean;
}

/**
 * Real unsubscribe (RFC 8058). If the sender advertised List-Unsubscribe-Post:
 * One-Click with an HTTPS endpoint, we POST `List-Unsubscribe=One-Click`
 * server-side — this needs NO mail-send scope, so it's compatible with our
 * read-only Gmail grant (CLAUDE.WEBAPP.md §1: the only permitted outbound action
 * is the user-initiated standardized unsubscribe).
 *
 * When only a mailto target exists, we can't send mail (read-only), so we mark
 * the brand unsubscribed (stops extraction + surfacing) and hand the mailto back
 * for the UI to offer — never a silent no-op.
 */
export async function executeUnsubscribe(
  userId: string,
  id: string,
): Promise<UnsubscribeResult | null> {
  const { data, error } = await adminDb
    .from("brands")
    .select("id, can_one_click_unsubscribe, unsubscribe_method")
    .eq("user_id", userId)
    .eq("id", id)
    .limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0] as
    | { id: string; can_one_click_unsubscribe: boolean; unsubscribe_method: UnsubMethod | null }
    | undefined;
  if (!row) return null;

  const method = row.unsubscribe_method ?? {};
  let used: UnsubscribeResult["method"] = "none";
  let sent = false;

  if (row.can_one_click_unsubscribe && method.http) {
    used = "http";
    sent = await postOneClick(method.http);
  } else if (method.mailto) {
    used = "mailto"; // can't auto-send under read-only; surfaced to the user
  }

  // Stop surfacing/extraction regardless — the user asked to be out.
  const brand = await setBrandStatus(userId, id, "unsubscribed");
  if (!brand) return null;
  return { brand, method: used, sent };
}

/** Best-effort RFC 8058 one-click POST. Never throws; returns whether it succeeded. */
async function postOneClick(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
