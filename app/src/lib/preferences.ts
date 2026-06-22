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
  "Groceries",
  "Fashion",
  "Outdoors",
  "Electronics",
  "Pets",
  "Books",
  "Gaming",
  "Health",
  "Auto",
  "Entertainment",
];

export const BRAND_OPTIONS = [
  "Delta",
  "United",
  "Southwest",
  "Marriott",
  "Hilton",
  "Airbnb",
  "Patagonia",
  "Nike",
  "Adidas",
  "Lululemon",
  "Allbirds",
  "REI",
  "Apple",
  "Sonos",
  "Samsung",
  "Best Buy",
  "Target",
  "Amazon",
  "Walmart",
  "Sephora",
  "Ulta",
  "Starbucks",
  "Sweetgreen",
  "Chipotle",
  "Blue Bottle",
  "DoorDash",
  "Uber",
  "Spotify",
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
  homeAirport: "JFK",
  travelStyle: "comfort",
};
