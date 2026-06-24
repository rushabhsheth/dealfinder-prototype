import { adminDb } from "../db/supabase.js";
import type { Offer } from "../types/domain.js";

/**
 * Offer reads + redemption. Offers are stored normalized (brand name lives on
 * the brands row), so we join the brand in and map snake_case → the camelCase
 * `Offer` contract the frontend shares (types/domain.ts ↔ app/src/types.ts).
 *
 * The feed order is payout-blind: relevance_score desc, then soonest-expiry.
 * relevance_score was computed at extraction time by ranking.scoreOffer, which
 * has no payout input.
 */

interface OfferRow {
  id: string;
  tier: "public" | "personalized";
  category: Offer["category"];
  title: string;
  subtitle: string;
  savings_amount: number | string;
  savings_percent: number | string;
  original_price: number | string | null;
  deal_price: number | string | null;
  code: string | null;
  expires_at: string | null;
  source_sent_at: string | null;
  terms: string;
  why_for_you: string | null;
  relevance_score: number | string | null;
  redeem_type: Offer["redeemType"];
  deal_url: string;
  brands: { brand: string; brand_initials: string } | null;
}

const SELECT = "*, brands(brand, brand_initials)";

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n) ? null : n;
}

function toPublicOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    tier: row.tier,
    category: row.category,
    brand: row.brands?.brand ?? "Deal",
    brandInitials: row.brands?.brand_initials ?? "•",
    title: row.title,
    subtitle: row.subtitle,
    savingsAmount: num(row.savings_amount) ?? 0,
    savingsPercent: num(row.savings_percent) ?? 0,
    originalPrice: num(row.original_price),
    dealPrice: num(row.deal_price),
    code: row.code,
    expiresAt: row.expires_at ?? "",
    receivedAt: row.source_sent_at ?? "",
    terms: row.terms,
    whyForYou: row.why_for_you,
    relevanceScore: num(row.relevance_score),
    redeemType: row.redeem_type,
    dealUrl: row.deal_url,
  };
}

// Inner-join the brand and keep only active brands, so paused/unsubscribed
// senders drop out of the feed (Enrolled Brands "pause" = stop surfacing).
const FEED_SELECT = "*, brands!inner(brand, brand_initials, status)";

/** The personalized feed, ordered payout-blind by relevance then expiry. */
export async function listRankedOffers(userId: string): Promise<Offer[]> {
  const { data, error } = await adminDb
    .from("offers")
    .select(FEED_SELECT)
    .eq("user_id", userId)
    .eq("brands.status", "active")
    .order("relevance_score", { ascending: false, nullsFirst: false })
    .order("expires_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data as OfferRow[]).map(toPublicOffer);
}

export async function getOffer(
  userId: string,
  id: string,
): Promise<Offer | null> {
  const { data, error } = await adminDb
    .from("offers")
    .select(SELECT)
    .eq("user_id", userId)
    .eq("id", id)
    .limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0] as OfferRow | undefined;
  return row ? toPublicOffer(row) : null;
}

/**
 * Record a redemption → write a savings row (idempotent per offer). Returns the
 * dollars credited, or null if the offer doesn't exist / isn't the user's.
 */
export async function recordRedemption(
  userId: string,
  offerId: string,
): Promise<{ saved: number } | null> {
  const { data, error } = await adminDb
    .from("offers")
    .select("id, brand_id, savings_amount")
    .eq("user_id", userId)
    .eq("id", offerId)
    .limit(1);
  if (error) throw new Error(error.message);
  const offer = data?.[0] as
    | { id: string; brand_id: string | null; savings_amount: number | string }
    | undefined;
  if (!offer) return null;

  const saved = num(offer.savings_amount) ?? 0;

  // Idempotent: don't double-credit the same offer.
  const { data: existing } = await adminDb
    .from("savings")
    .select("id")
    .eq("user_id", userId)
    .eq("offer_id", offerId)
    .limit(1);
  if (existing?.[0]) return { saved };

  const { error: insErr } = await adminDb.from("savings").insert({
    user_id: userId,
    offer_id: offerId,
    brand_id: offer.brand_id,
    amount_saved: saved,
  });
  if (insErr) throw new Error(insErr.message);
  return { saved };
}
