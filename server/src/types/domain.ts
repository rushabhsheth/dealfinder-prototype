/**
 * Backend domain types — the API contract.
 *
 * These deliberately line up with app/src/types.ts so the frontend and server
 * speak one vocabulary. The enum string unions are identical; DB rows
 * (snake_case columns) are mapped to these camelCase shapes at the route layer.
 *
 * Keep this in sync with:
 *   - app/src/types.ts (frontend types)
 *   - supabase/migrations/20260622170000_init.sql (the *_t enums)
 */

export type DealTier = "public" | "personalized";
export type DealCategory = "travel" | "retail" | "dining" | "tech";
export type RedeemType = "code" | "book" | "link";
export type BrandSource = "enrolled" | "detected";
export type BrandStatus = "active" | "paused" | "unsubscribed";
export type EntitlementTier = "free" | "trial" | "paid";
export type OAuthProvider = "google";
export type ConnectionStatus = "active" | "revoked";

/** Mirrors app/src/types.ts `Deal`. Persisted as a row in `offers`. */
export interface Offer {
  id: string;
  tier: DealTier;
  category: DealCategory;
  brand: string;
  brandInitials: string;
  title: string;
  subtitle: string;
  savingsAmount: number;
  savingsPercent: number;
  originalPrice: number | null;
  dealPrice: number | null;
  code: string | null;
  expiresAt: string; // ISO
  receivedAt: string; // ISO — when the source email was sent ("" if unknown)
  terms: string;
  whyForYou: string | null;
  relevanceScore: number | null;
  redeemType: RedeemType;
  dealUrl: string;
}

/** Mirrors app/src/types.ts `EnrolledBrand`. Persisted as a row in `brands`. */
export interface EnrolledBrand {
  id: string;
  brand: string;
  brandInitials: string;
  logoUrl: string | null;
  category: DealCategory;
  source: BrandSource;
  status: BrandStatus;
  enrolledAt: string; // ISO
  enrolledReason: string | null;
  senderDomain: string;
  dealsSurfaced: number;
  totalSaved: number;
  lastOfferAt: string | null;
  emailsPerMonth: number;
  canOneClickUnsubscribe: boolean;
  offerDealIds: string[];
}

export interface Entitlement {
  tier: EntitlementTier;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  downgraded: boolean;
}

/** The authenticated user as the API exposes it (no tokens, ever). */
export interface AuthedUser {
  id: string;
  email: string;
}

/**
 * An email-provider connection as the API exposes it. NOTE: token ciphertext is
 * intentionally absent — tokens never leave the server.
 */
export interface InboxConnection {
  id: string;
  provider: OAuthProvider;
  accountEmail: string | null;
  scopes: string[];
  status: ConnectionStatus;
  connectedAt: string;
  lastSyncedAt: string | null;
}
