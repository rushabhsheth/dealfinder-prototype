import { describe, it, expect } from "vitest";
import {
  aggregateSavings,
  type OfferLite,
  type SavingLite,
} from "../src/services/savings.js";

const NOW = Date.parse("2026-06-22T00:00:00Z");

const offers: OfferLite[] = [
  { id: "o1", savings_amount: 100, savings_percent: 20, category: "retail", expires_at: "2026-07-30T00:00:00Z" },
  { id: "o2", savings_amount: 50, savings_percent: 10, category: "travel", expires_at: "2026-07-30T00:00:00Z" },
  { id: "o3", savings_amount: 30, savings_percent: 0, category: "retail", expires_at: "2026-06-01T00:00:00Z" }, // expired, unredeemed
];

const savings: SavingLite[] = [
  {
    amount_saved: 100,
    redeemed_at: "2026-06-10T00:00:00Z",
    offer_id: "o1",
    offers: { category: "retail" },
    brands: { brand: "Patagonia" },
  },
];

describe("aggregateSavings", () => {
  const r = aggregateSavings(offers, savings, NOW);

  it("sums surfaced value over all offers", () => {
    expect(r.surfaced).toBe(180);
  });

  it("sums redeemed value over the savings ledger (the headline)", () => {
    expect(r.redeemed).toBe(100);
    expect(r.cumulative.totalSaved).toBe(100);
  });

  it("counts only still-live, unredeemed value as available", () => {
    // o1 redeemed (excluded), o3 expired (excluded) → only o2 ($50) remains.
    expect(r.available).toBe(50);
  });

  it("reports redeemed count and surfaced count", () => {
    expect(r.cumulative.dealsRedeemed).toBe(1);
    expect(r.cumulative.offersSurfaced).toBe(3);
  });

  it("builds a cumulative timeline of redemptions", () => {
    expect(r.cumulative.timeline).toEqual([{ date: "2026-06-10", total: 100 }]);
  });

  it("lists recent redemptions newest-first with brand + amount", () => {
    expect(r.recent[0]).toMatchObject({ dealId: "o1", brand: "Patagonia", saved: 100 });
  });

  it("attributes redeemed value by category", () => {
    expect(r.cumulative.byCategory).toEqual([{ category: "retail", saved: 100 }]);
  });
});
