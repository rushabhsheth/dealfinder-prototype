import { adminDb } from "../db/supabase.js";
import type { DealCategory } from "../types/domain.js";

/**
 * Savings aggregation (SAVINGS_PRD.md §4.0/§5). Two honest numbers + the gap:
 *   surfaced  — total value of every offer Scout put in front of the user
 *   redeemed  — value of offers the user actually acted on (the headline)
 *   available — still-live, unredeemed surfaced value ("still waiting for you")
 * Everything is a defensible sum of real offer values — never inflated.
 */

export interface RedeemedItem {
  dealId: string | null;
  brand: string;
  saved: number;
  redeemedAt: string;
}

export interface SavingsSummary {
  surfaced: number;
  redeemed: number;
  available: number;
  cumulative: {
    totalSaved: number; // == redeemed (the headline)
    surfacedValue: number;
    availableValue: number;
    dealsRedeemed: number;
    offersSurfaced: number;
    averageSavingPercent: number;
    byCategory: { category: DealCategory; saved: number }[];
    timeline: { date: string; total: number }[];
  };
  recent: RedeemedItem[];
}

export interface OfferLite {
  id: string;
  savings_amount: number | string;
  savings_percent: number | string;
  category: DealCategory;
  expires_at: string | null;
}
export interface SavingLite {
  amount_saved: number | string;
  redeemed_at: string;
  offer_id: string | null;
  offers: { category: DealCategory } | null;
  brands: { brand: string } | null;
}

const n = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const x = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(x) ? 0 : x;
};
const round2 = (x: number): number => Math.round(x * 100) / 100;

export async function getSavingsSummary(
  userId: string,
  now: number = Date.now(),
): Promise<SavingsSummary> {
  const [{ data: offerData, error: oErr }, { data: savingData, error: sErr }] =
    await Promise.all([
      adminDb
        .from("offers")
        .select("id, savings_amount, savings_percent, category, expires_at")
        .eq("user_id", userId),
      adminDb
        .from("savings")
        .select("amount_saved, redeemed_at, offer_id, offers(category), brands(brand)")
        .eq("user_id", userId)
        .order("redeemed_at", { ascending: true }),
    ]);
  if (oErr) throw new Error(oErr.message);
  if (sErr) throw new Error(sErr.message);

  return aggregateSavings(
    (offerData ?? []) as OfferLite[],
    (savingData ?? []) as unknown as SavingLite[],
    now,
  );
}

/**
 * Pure aggregation (no DB) — the savings math, isolated so it's unit-testable.
 * `savings` is expected in ascending redeemed_at order (the query guarantees it).
 */
export function aggregateSavings(
  offers: OfferLite[],
  savings: SavingLite[],
  now: number = Date.now(),
): SavingsSummary {
  const redeemedOfferIds = new Set(
    savings.map((s) => s.offer_id).filter((x): x is string => Boolean(x)),
  );

  const surfaced = offers.reduce((sum, o) => sum + n(o.savings_amount), 0);
  const redeemed = savings.reduce((sum, s) => sum + n(s.amount_saved), 0);
  const available = offers
    .filter((o) => !redeemedOfferIds.has(o.id))
    .filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > now) // still-live only
    .reduce((sum, o) => sum + n(o.savings_amount), 0);

  const withPct = offers.filter((o) => n(o.savings_percent) > 0);
  const averageSavingPercent = withPct.length
    ? withPct.reduce((s, o) => s + n(o.savings_percent), 0) / withPct.length
    : 0;

  // Redeemed value by category.
  const byCatMap = new Map<DealCategory, number>();
  for (const s of savings) {
    const cat = s.offers?.category;
    if (!cat) continue;
    byCatMap.set(cat, (byCatMap.get(cat) ?? 0) + n(s.amount_saved));
  }
  const byCategory = [...byCatMap.entries()].map(([category, saved]) => ({
    category,
    saved: round2(saved),
  }));

  // Cumulative redeemed-over-time (savings already sorted ascending).
  let running = 0;
  const timeline = savings.map((s) => {
    running += n(s.amount_saved);
    return { date: s.redeemed_at.slice(0, 10), total: round2(running) };
  });

  const recent: RedeemedItem[] = [...savings]
    .reverse()
    .slice(0, 20)
    .map((s) => ({
      dealId: s.offer_id,
      brand: s.brands?.brand ?? "Deal",
      saved: round2(n(s.amount_saved)),
      redeemedAt: s.redeemed_at,
    }));

  return {
    surfaced: round2(surfaced),
    redeemed: round2(redeemed),
    available: round2(available),
    cumulative: {
      totalSaved: round2(redeemed),
      surfacedValue: round2(surfaced),
      availableValue: round2(available),
      dealsRedeemed: savings.length,
      offersSurfaced: offers.length,
      averageSavingPercent: Math.round(averageSavingPercent * 10) / 10,
      byCategory,
      timeline,
    },
    recent,
  };
}
