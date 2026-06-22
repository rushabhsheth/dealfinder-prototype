import { describe, it, expect } from "vitest";
import { scoreOffer, buildWhyForYou } from "../src/services/ranking.js";
import type { ExtractedOffer } from "../src/services/extraction.js";

const base: ExtractedOffer = {
  category: "retail",
  title: "Sitewide sale",
  subtitle: "",
  savingsAmount: 0,
  savingsPercent: 0,
  originalPrice: null,
  dealPrice: null,
  code: null,
  expiresAt: null,
  terms: "",
  redeemType: "link",
  dealUrl: "",
};

const NOW = Date.parse("2026-06-22T00:00:00Z");

describe("scoreOffer (payout-blind ranking)", () => {
  it("always returns a value in [0,1]", () => {
    const s = scoreOffer({ ...base, savingsPercent: 50 }, "Acme", undefined, NOW);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("ranks a deeper discount higher (savings signal)", () => {
    const small = scoreOffer({ ...base, savingsPercent: 10 }, "Acme", undefined, NOW);
    const big = scoreOffer({ ...base, savingsPercent: 50 }, "Acme", undefined, NOW);
    expect(big).toBeGreaterThan(small);
  });

  it("ranks a near-expiry deal higher (urgency signal)", () => {
    const far = scoreOffer(
      { ...base, expiresAt: "2026-07-20T00:00:00Z" },
      "Acme",
      undefined,
      NOW,
    );
    const soon = scoreOffer(
      { ...base, expiresAt: "2026-06-24T00:00:00Z" },
      "Acme",
      undefined,
      NOW,
    );
    expect(soon).toBeGreaterThan(far);
  });

  it("boosts a category the user picked (fit signal)", () => {
    const offer = { ...base, category: "travel" as const };
    const neutral = scoreOffer(offer, "Acme", { categories: [], brands: [] }, NOW);
    const matched = scoreOffer(offer, "Acme", { categories: ["travel"], brands: [] }, NOW);
    expect(matched).toBeGreaterThan(neutral);
  });

  it("is deterministic — same inputs, same score (no random/payout term)", () => {
    const a = scoreOffer({ ...base, savingsPercent: 30 }, "Acme", undefined, NOW);
    const b = scoreOffer({ ...base, savingsPercent: 30 }, "Acme", undefined, NOW);
    expect(a).toBe(b);
  });

  it("gives an expired deal no urgency boost", () => {
    const expired = scoreOffer(
      { ...base, expiresAt: "2026-06-01T00:00:00Z" },
      "Acme",
      undefined,
      NOW,
    );
    const noExpiry = scoreOffer(base, "Acme", undefined, NOW);
    expect(expired).toBe(noExpiry);
  });
});

describe("buildWhyForYou", () => {
  it("leads with a followed brand", () => {
    const why = buildWhyForYou(base, "Patagonia", { categories: [], brands: ["patagonia"] });
    expect(why).toBe("Because you follow Patagonia");
  });

  it("falls back to category match", () => {
    const why = buildWhyForYou(
      { ...base, category: "tech" },
      "Acme",
      { categories: ["tech"], brands: [] },
    );
    expect(why).toBe("Matches your interest in tech");
  });

  it("falls back to a strong savings line", () => {
    const why = buildWhyForYou({ ...base, savingsPercent: 40 }, "Acme");
    expect(why).toContain("40%");
  });

  it("returns null when there's nothing notable to say", () => {
    expect(buildWhyForYou(base, "Acme")).toBeNull();
  });
});
