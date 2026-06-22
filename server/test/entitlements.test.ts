import { describe, it, expect } from "vitest";
import {
  isTrialExpired,
  toView,
  type EntitlementRow,
} from "../src/services/entitlements.js";

const NOW = Date.parse("2026-06-22T00:00:00Z");
const inDays = (d: number) => new Date(NOW + d * 86_400_000).toISOString();

describe("isTrialExpired", () => {
  it("is true for a trial past its end date", () => {
    const row: EntitlementRow = {
      tier: "trial",
      trial_started_at: inDays(-20),
      trial_ends_at: inDays(-1),
      downgraded: false,
    };
    expect(isTrialExpired(row, NOW)).toBe(true);
  });

  it("is false for a trial still in its window", () => {
    const row: EntitlementRow = {
      tier: "trial",
      trial_started_at: inDays(-2),
      trial_ends_at: inDays(12),
      downgraded: false,
    };
    expect(isTrialExpired(row, NOW)).toBe(false);
  });

  it("is false for paid and free regardless of dates", () => {
    expect(
      isTrialExpired({ tier: "paid", trial_started_at: null, trial_ends_at: inDays(-99), downgraded: false }, NOW),
    ).toBe(false);
    expect(
      isTrialExpired({ tier: "free", trial_started_at: null, trial_ends_at: null, downgraded: true }, NOW),
    ).toBe(false);
  });
});

describe("toView", () => {
  it("marks trial/paid as premium and free as not", () => {
    expect(toView({ tier: "trial", trial_started_at: inDays(-1), trial_ends_at: inDays(13), downgraded: false }, NOW).isPremium).toBe(true);
    expect(toView({ tier: "paid", trial_started_at: null, trial_ends_at: null, downgraded: false }, NOW).isPremium).toBe(true);
    expect(toView({ tier: "free", trial_started_at: null, trial_ends_at: null, downgraded: false }, NOW).isPremium).toBe(false);
  });

  it("computes days left in the trial (ceil), zero when not on trial", () => {
    const view = toView(
      { tier: "trial", trial_started_at: inDays(-4), trial_ends_at: inDays(10), downgraded: false },
      NOW,
    );
    expect(view.trialDaysLeft).toBe(10);
    expect(toView({ tier: "paid", trial_started_at: null, trial_ends_at: null, downgraded: false }, NOW).trialDaysLeft).toBe(0);
  });
});
