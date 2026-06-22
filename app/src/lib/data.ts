// Data-access layer. In pure-demo/mock mode this reads the local JSON (per
// CLAUDE.md); when a real backend is configured (VITE_API_BASE set) the async
// `load*` accessors below fetch live Gmail-derived data instead. The sync
// exports remain the mock source of truth for the public catalog and as the
// demo-mode fallback (CLAUDE.WEBAPP.md migration convention: replace mock data
// BEHIND an interface, don't delete it).

import dealsJson from "../data/deals.json";
import savingsJson from "../data/savings.json";
import watchesJson from "../data/watches.json";
import brandsJson from "../data/brands.json";
import type {
  Deal,
  DealCategory,
  EnrolledBrand,
  RedeemedDeal,
  SavingsData,
  Watch,
} from "../types";
import {
  backendEnabled,
  getOffers,
  getOffer as apiGetOffer,
  getBrands,
  getSavings,
  ApiError,
} from "./api";

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

// ── Live data accessors (backend mode) ───────────────────────────────────────
// Each branches on `backendEnabled`: real API when configured, mock otherwise.
// Screens call these (via useAsync) instead of importing the sync exports, so
// the same component renders mock or live data with no further changes.

/** Personalized/ranked deals for the For You feed (payout-blind order). */
export async function loadPersonalizedDeals(): Promise<Deal[]> {
  if (backendEnabled) return (await getOffers()).offers;
  return personalizedDeals;
}

/**
 * A single deal by id. In backend mode personalized offers come from the API;
 * public-catalog deals stay mock, so a 404 falls back to the local catalog.
 */
export async function loadDeal(id: string | undefined): Promise<Deal | undefined> {
  if (!id) return undefined;
  if (backendEnabled) {
    try {
      return (await apiGetOffer(id)).offer;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return getDeal(id);
      throw err;
    }
  }
  return getDeal(id);
}

export async function loadEnrolledBrands(): Promise<EnrolledBrand[]> {
  if (backendEnabled) return (await getBrands()).brands;
  return enrolledBrands;
}

/** Normalized savings view consumed by the Dashboard (mock + live agree). */
export interface SavingsView {
  totalSaved: number; // redeemed — the headline
  surfaced: number;
  available: number;
  dealsRedeemed: number;
  averageSavingPercent: number;
  byCategory: { category: DealCategory; saved: number }[];
  timeline: { date: string; saved: number }[];
  recent: RedeemedDeal[];
}

export async function loadSavings(): Promise<SavingsView> {
  if (backendEnabled) {
    const { savings: s } = await getSavings();
    return {
      totalSaved: s.cumulative.totalSaved,
      surfaced: s.surfaced,
      available: s.available,
      dealsRedeemed: s.cumulative.dealsRedeemed,
      averageSavingPercent: s.cumulative.averageSavingPercent,
      byCategory: s.cumulative.byCategory,
      timeline: s.cumulative.timeline.map((t) => ({ date: t.date, saved: t.total })),
      recent: s.recent.map((r) => ({
        dealId: r.dealId ?? "",
        brand: r.brand,
        saved: r.saved,
        redeemedAt: r.redeemedAt,
      })),
    };
  }
  // Mock: derive surfaced from the personalized catalog; the rest is seed data.
  const surfaced = personalizedDeals.reduce((sum, d) => sum + d.savingsAmount, 0);
  const c = savings.cumulative;
  return {
    totalSaved: c.totalSaved,
    surfaced,
    available: Math.max(0, surfaced - c.totalSaved),
    dealsRedeemed: c.dealsRedeemed,
    averageSavingPercent: c.averageSavingPercent,
    byCategory: c.byCategory,
    timeline: c.timeline,
    recent: savings.redeemed,
  };
}

/** Post-scan summary for the "We found you $X" reveal. */
export interface ScanSummaryView {
  foundTotal: number;
  offersFound: number;
  scannedMessages: number;
  topDeals: Deal[];
}

export async function loadScanSummary(scan?: {
  foundTotal: number;
  offersFound: number;
  messagesScanned: number;
} | null): Promise<ScanSummaryView> {
  if (backendEnabled) {
    const offers = (await getOffers()).offers;
    const { savings: s } = await getSavings();
    return {
      foundTotal: scan?.foundTotal ?? s.surfaced,
      offersFound: scan?.offersFound ?? offers.length,
      scannedMessages: scan?.messagesScanned ?? 0,
      topDeals: offers.slice(0, 3),
    };
  }
  const fs = savings.firstScan;
  return {
    foundTotal: fs.foundTotal,
    offersFound: fs.offersFound,
    scannedMessages: fs.scannedMessages,
    topDeals: fs.topDealIds.map(getDeal).filter((d): d is Deal => Boolean(d)),
  };
}
