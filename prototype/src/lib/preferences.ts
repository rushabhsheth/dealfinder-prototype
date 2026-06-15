// Shared option lists + defaults for the personalization inputs, used by both
// the Interest Survey ("About you") and Settings → Preferences so the two
// surfaces render identical controls (USER_PREFERENCES_PRD.md §5.2).

import type { TravelStyle, UserPreferences } from "../types";

export const CATEGORY_OPTIONS = [
  "Travel",
  "Retail",
  "Dining",
  "Tech",
  "Home",
  "Fitness",
  "Beauty",
  "Kids",
];

export const BRAND_OPTIONS = [
  "Delta",
  "Patagonia",
  "Marriott",
  "Sonos",
  "Allbirds",
  "Sweetgreen",
  "Nike",
  "Apple",
];

export const TRAVEL_STYLE_OPTIONS: { value: TravelStyle; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "comfort", label: "Comfort" },
  { value: "luxury", label: "Luxury" },
];

/**
 * First-run defaults. Seeded with demo-friendly values (rather than empty, per
 * the PRD's alternative) so Preferences and personalization look populated out
 * of the box for live demos.
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  categories: ["Travel", "Retail"],
  brands: ["Delta", "Patagonia"],
  homeAirport: "SFO",
  travelStyle: "comfort",
};
