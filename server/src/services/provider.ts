/**
 * Email-provider abstraction. Gmail is the only implementation today; Outlook
 * (Microsoft Graph) drops in behind the same interface later without touching
 * the scan worker or extraction code (GMAIL_KICKOFF.md: keep the seam, don't
 * build Outlook yet).
 *
 * Everything here operates on a raw OAuth access token the caller has already
 * refreshed (see connections.getFreshAccessToken) — providers never deal with
 * token storage.
 */

/** A promo message reduced to the fields extraction needs. No raw HTML kept. */
export interface ParsedMessage {
  messageId: string;
  fromName: string;
  fromEmail: string;
  fromDomain: string; // e.g. "patagonia.com"
  subject: string;
  snippet: string;
  /** Decoded, tag-stripped, length-capped body text. */
  bodyText: string;
  /** RFC 8058 List-Unsubscribe header value, if present (mailto/https). */
  listUnsubscribe: string | null;
  /** True when List-Unsubscribe-Post: List-Unsubscribe=One-Click is advertised. */
  oneClickUnsubscribe: boolean;
  /** Message date (ISO), best-effort from the Date header. */
  date: string | null;
}

export interface ListOptions {
  /** Max message ids to pull for a scan (bounds latency/cost). */
  maxResults: number;
  /** Gmail-style search constraint, e.g. "newer_than:90d". */
  query?: string;
}

export interface EmailProvider {
  /** Ids of promotional messages, newest first. */
  listPromoMessageIds(accessToken: string, opts: ListOptions): Promise<string[]>;
  /** Fetch + parse a single message into the minimal shape we extract from. */
  getMessage(accessToken: string, id: string): Promise<ParsedMessage>;
}
