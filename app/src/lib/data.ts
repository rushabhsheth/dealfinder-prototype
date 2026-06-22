// Typed accessors over the mock JSON. Data is imported, never fetched (per CLAUDE.md).

import dealsJson from "../data/deals.json";
import savingsJson from "../data/savings.json";
import watchesJson from "../data/watches.json";
import brandsJson from "../data/brands.json";
import type { Deal, EnrolledBrand, SavingsData, Watch } from "../types";

export const deals: Deal[] = (dealsJson as { deals: Deal[] }).deals;
export const savings: SavingsData = savingsJson as unknown as SavingsData;
export const watches: Watch[] = (watchesJson as { watches: Watch[] }).watches;
export const enrolledBrands: EnrolledBrand[] = (
  brandsJson as unknown as { brands: EnrolledBrand[] }
).brands;

export const publicDeals: Deal[] = deals.filter((d) => d.tier === "public");

/**
 * Personalized deals in ranked order. Ranking is payout-blind (CLAUDE.md hard
 * rule 6): we sort purely by the precomputed relevance score, which blends
 * fit + savings + urgency. Highest relevance first.
 */
export const personalizedDeals: Deal[] = deals
  .filter((d) => d.tier === "personalized")
  .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

export function getDeal(id: string | undefined): Deal | undefined {
  return deals.find((d) => d.id === id);
}

export function getWatch(id: string | undefined): Watch | undefined {
  return watches.find((w) => w.id === id);
}

export const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel",
  retail: "Retail",
  dining: "Dining",
  tech: "Tech",
};
