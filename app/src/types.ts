// Shared types for the DealFinder prototype. All data is mock JSON in /src/data.

export type DealTier = "public" | "personalized";
export type DealCategory = "travel" | "retail" | "dining" | "tech";
export type RedeemType = "code" | "book" | "link";
/** A user's signal on an offer in the feed (Interested / Maybe / Not for me). */
export type DealInterest = "interested" | "maybe" | "not";

export interface Deal {
  id: string;
  tier: DealTier;
  category: DealCategory;
  brand: string;
  brandInitials: string;
  title: string;
  subtitle: string;
  /** Dollars saved. 0 when unknown (some public deals only show %). */
  savingsAmount: number;
  savingsPercent: number;
  originalPrice: number | null;
  dealPrice: number | null;
  code: string | null;
  /** ISO date. "Today" for the demo is 2026-06-15. */
  expiresAt: string;
  terms: string;
  whyForYou: string | null;
  relevanceScore: number | null;
  redeemType: RedeemType;
  dealUrl: string;
}

export interface Trial {
  lengthDays: number;
  startedAt: string;
  endsAt: string;
  dayOfTrial: number;
  annualPrice: number;
  monthlyEquivalent: number;
}

export interface FirstScan {
  foundTotal: number;
  offersFound: number;
  scannedMessages: number;
  topDealIds: string[];
}

export interface CategorySaving {
  category: DealCategory;
  saved: number;
}

export interface TimelinePoint {
  date: string;
  saved: number;
}

export interface RedeemedDeal {
  dealId: string;
  brand: string;
  saved: number;
  redeemedAt: string;
}

export interface SavingsData {
  trial: Trial;
  firstScan: FirstScan;
  cumulative: {
    totalSaved: number;
    dealsRedeemed: number;
    averageSavingPercent: number;
    byCategory: CategorySaving[];
    timeline: TimelinePoint[];
  };
  redeemed: RedeemedDeal[];
}

export type WatchStatus = "watching" | "alert";

export interface Watch {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  targetPrice: number;
  currentPrice: number;
  lowestSeen: number;
  status: WatchStatus;
  alertMessage: string | null;
  linkedDealId: string | null;
  createdAt: string;
}

/** Demo entitlement tier — drives which screens/feeds the user sees. */
export type Tier = "free" | "trial" | "paid";

// ── User preferences (Interest Survey "About you" → Settings → Preferences) ──
export type TravelStyle = "budget" | "comfort" | "luxury";

/**
 * The four personalization inputs from the Interest Survey. Single source of
 * truth on DemoContext, mirrored to localStorage (see USER_PREFERENCES_PRD.md).
 * In the real app this becomes a `/me/preferences` record — same shape.
 */
export interface UserPreferences {
  categories: string[]; // survey category labels, e.g. ["Travel", "Retail"]
  brands: string[]; // favorite-brand labels, e.g. ["Delta", "Patagonia"]
  homeAirport: string; // 3-letter IATA, uppercased, e.g. "SFO"
  travelStyle: TravelStyle;
}

// ── Enrolled Brands (see ENROLLED_BRANDS_PRD.md) ──
export type BrandSource = "enrolled" | "detected";
export type BrandStatus = "active" | "paused" | "unsubscribed";

/**
 * A brand sending the user promos via DealFinder — either auto-enrolled by us
 * or detected already in their inbox. Mock data in /src/data/brands.json; the
 * user's live status changes are tracked as overrides on DemoContext.
 */
export interface EnrolledBrand {
  id: string;
  brand: string;
  brandInitials: string;
  category: DealCategory;
  source: BrandSource; // we enrolled them vs. already in inbox
  status: BrandStatus; // baseline status (before any user override)
  enrolledAt: string; // ISO
  enrolledReason: string | null; // "You picked Travel"
  senderDomain: string; // e.g. patagonia.com — the promo sender
  dealsSurfaced: number;
  totalSaved: number; // USD, lifetime from this brand
  lastOfferAt: string | null; // ISO
  emailsPerMonth: number; // observed frequency
  canOneClickUnsubscribe: boolean; // RFC 8058 List-Unsubscribe present
  /** Deal IDs surfaced from this brand — links into existing Deal Detail. */
  offerDealIds: string[];
}
