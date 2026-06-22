import { describe, it, expect } from "vitest";
import { _internals } from "../src/services/scan.js";
import type { ExtractedOffer } from "../src/services/extraction.js";

const { dedupHash, parseUnsubscribe, initialsFor } = _internals;

const offer: ExtractedOffer = {
  category: "retail",
  title: "30% off jackets",
  subtitle: "",
  savingsAmount: 0,
  savingsPercent: 30,
  originalPrice: null,
  dealPrice: null,
  code: "WARM30",
  expiresAt: "2026-06-30T00:00:00Z",
  terms: "",
  redeemType: "code",
  dealUrl: "",
};

describe("dedupHash (extraction idempotency)", () => {
  it("is stable for identical offers (a re-scan dedups)", () => {
    expect(dedupHash("patagonia.com", offer)).toBe(dedupHash("patagonia.com", offer));
  });

  it("is insensitive to title whitespace/case", () => {
    const a = dedupHash("patagonia.com", offer);
    const b = dedupHash("patagonia.com", { ...offer, title: "30% Off   Jackets" });
    expect(a).toBe(b);
  });

  it("differs when the code or expiry differs", () => {
    const a = dedupHash("patagonia.com", offer);
    expect(dedupHash("patagonia.com", { ...offer, code: "WARM40" })).not.toBe(a);
    expect(dedupHash("patagonia.com", { ...offer, expiresAt: "2026-07-01" })).not.toBe(a);
  });
});

describe("parseUnsubscribe (RFC 8058)", () => {
  it("splits http and mailto targets", () => {
    const r = parseUnsubscribe("<https://x.com/u?id=1>, <mailto:unsub@x.com>");
    expect(r.http).toBe("https://x.com/u?id=1");
    expect(r.mailto).toBe("mailto:unsub@x.com");
  });

  it("returns nulls for a missing header", () => {
    expect(parseUnsubscribe(null)).toEqual({ http: null, mailto: null });
  });
});

describe("initialsFor", () => {
  it("uses two-word initials", () => {
    expect(initialsFor("Delta Air Lines")).toBe("DA");
  });
  it("uses first two letters of a single word", () => {
    expect(initialsFor("Patagonia")).toBe("PA");
  });
  it("falls back to a bullet for empty input", () => {
    expect(initialsFor("")).toBe("•");
  });
});
