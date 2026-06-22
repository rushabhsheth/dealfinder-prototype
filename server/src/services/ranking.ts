import type { ExtractedOffer } from "./extraction.js";

/**
 * Payout-blind ranking (CLAUDE.WEBAPP.md hard rule 4 / CORE_FEED_PRD §4.1).
 *
 * The relevance score blends THREE signals and nothing else:
 *   fit (does it match the user's stated interests) + savings depth + urgency.
 * There is deliberately NO affiliate/commission/payout term. A brand cannot pay
 * to rank higher because no payout value exists in this function's inputs.
 *
 * Score is deterministic and computed server-side at extraction time, then
 * stored on the offer row; the feed simply orders by it descending.
 */

export interface RankPreferences {
  categories: string[]; // e.g. ["travel", "tech"]
  brands: string[]; // free-text favourite brands
}

export const NEUTRAL_PREFERENCES: RankPreferences = { categories: [], brands: [] };

const WEIGHTS = { fit: 0.5, savings: 0.35, urgency: 0.15 };

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** 0..1 — how deep the discount is, from percent first, then $ off original. */
function savingsScore(offer: ExtractedOffer): number {
  if (offer.savingsPercent > 0) return clamp01(offer.savingsPercent / 60);
  if (offer.originalPrice && offer.dealPrice && offer.originalPrice > 0) {
    return clamp01((offer.originalPrice - offer.dealPrice) / offer.originalPrice);
  }
  if (offer.savingsAmount > 0) return clamp01(offer.savingsAmount / 200);
  return 0;
}

/** 0..1 — closer to expiry ranks slightly higher (within a 14-day window). */
function urgencyScore(offer: ExtractedOffer, now: number): number {
  if (!offer.expiresAt) return 0;
  const ms = new Date(offer.expiresAt).getTime() - now;
  if (Number.isNaN(ms) || ms <= 0) return 0; // expired = no urgency boost
  const days = ms / 86_400_000;
  return clamp01((14 - days) / 14);
}

/** 0..1 — match against the user's stated categories/brands. Neutral if none. */
function fitScore(
  offer: ExtractedOffer,
  brand: string,
  prefs: RankPreferences,
): number {
  const hasPrefs = prefs.categories.length > 0 || prefs.brands.length > 0;
  if (!hasPrefs) return 0.5; // no signal → don't bias the order
  let score = 0.3;
  if (prefs.categories.includes(offer.category)) score += 0.4;
  const brandLc = brand.toLowerCase();
  if (prefs.brands.some((b) => b && brandLc.includes(b.toLowerCase()))) {
    score += 0.3;
  }
  return clamp01(score);
}

/** The single relevance number stored on each offer. Higher = better for you. */
export function scoreOffer(
  offer: ExtractedOffer,
  brand: string,
  prefs: RankPreferences = NEUTRAL_PREFERENCES,
  now: number = Date.now(),
): number {
  const score =
    WEIGHTS.fit * fitScore(offer, brand, prefs) +
    WEIGHTS.savings * savingsScore(offer) +
    WEIGHTS.urgency * urgencyScore(offer, now);
  return Math.round(clamp01(score) * 10_000) / 10_000; // 4 dp, fits numeric(5,4)
}

/**
 * A human "why you're seeing this" line — fit reason first, then savings, then
 * urgency. Mirrors CORE_FEED_PRD §4.1's rationale on top items.
 */
export function buildWhyForYou(
  offer: ExtractedOffer,
  brand: string,
  prefs: RankPreferences = NEUTRAL_PREFERENCES,
): string | null {
  const brandLc = brand.toLowerCase();
  if (prefs.brands.some((b) => b && brandLc.includes(b.toLowerCase()))) {
    return `Because you follow ${brand}`;
  }
  if (prefs.categories.includes(offer.category)) {
    return `Matches your interest in ${offer.category}`;
  }
  if (offer.savingsPercent >= 20) {
    return `Save ${Math.round(offer.savingsPercent)}% — a strong deal`;
  }
  if (offer.savingsAmount >= 25) {
    return `Save $${Math.round(offer.savingsAmount)} on this`;
  }
  return null;
}
