// Shared types for the DealFinder prototype. All data is mock JSON in /src/data.

export type DealTier = "public" | "personalized";
export type DealCategory = "travel" | "retail" | "dining" | "tech";
export type RedeemType = "code" | "book" | "link";

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
