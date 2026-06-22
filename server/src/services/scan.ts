import { createHash } from "node:crypto";
import { adminDb } from "../db/supabase.js";
import { config, anthropicConfigured } from "../config.js";
import {
  getActiveGoogleConnection,
  getFreshAccessToken,
  markSynced,
} from "./connections.js";
import { gmailProvider } from "./gmailData.js";
import { extractOffers, type ExtractedOffer } from "./extraction.js";
import {
  scoreOffer,
  buildWhyForYou,
  NEUTRAL_PREFERENCES,
  type RankPreferences,
} from "./ranking.js";
import type { ParsedMessage } from "./provider.js";
import type { DealCategory } from "../types/domain.js";

/**
 * The scan worker (Phase 2). Pulls promo mail for the user's connected inbox,
 * extracts structured offers, and writes them — linked to detected brands —
 * into the offers/brands/savings tables. It runs ASYNC (not request-bound): the
 * route creates a `scans` row and kicks this off; the First Scan screen polls
 * progress off that row.
 *
 * Data minimization (PRD §8): only structured offers + sender metadata are
 * persisted. The raw email body is parsed in memory and discarded;
 * offers.source_message_id is just the opaque Gmail id used for dedup.
 */

const CONCURRENCY = 5;

interface BrandRef {
  id: string;
  status: "active" | "paused" | "unsubscribed";
}

/** Run a list through `fn` with bounded concurrency, preserving order. */
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return results;
}

function initialsFor(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0]! + words[1]![0]!).toUpperCase();
}

/** Stable hash so the same offer from a re-scan dedups (unique user_id,dedup_hash). */
function dedupHash(domain: string, offer: ExtractedOffer): string {
  const key = [
    domain.toLowerCase(),
    offer.title.toLowerCase().replace(/\s+/g, " ").trim(),
    offer.code?.toLowerCase() ?? "",
    offer.expiresAt ?? "",
  ].join("|");
  return createHash("sha256").update(key).digest("hex");
}

/** Parse an RFC 8058 List-Unsubscribe header into its http / mailto targets. */
function parseUnsubscribe(
  header: string | null,
): { http: string | null; mailto: string | null } {
  if (!header) return { http: null, mailto: null };
  const targets = [...header.matchAll(/<([^>]+)>/g)].map((m) => m[1]!);
  return {
    http: targets.find((t) => /^https?:/i.test(t)) ?? null,
    mailto: targets.find((t) => /^mailto:/i.test(t)) ?? null,
  };
}

async function findOrCreateBrand(
  userId: string,
  msg: ParsedMessage,
  category: DealCategory,
): Promise<BrandRef | null> {
  const domain = msg.fromDomain;
  if (!domain) return null;

  const { data: existing } = await adminDb
    .from("brands")
    .select("id, status")
    .eq("user_id", userId)
    .eq("sender_domain", domain)
    .limit(1);
  const found = existing?.[0] as BrandRef | undefined;
  if (found) return found;

  const unsub = parseUnsubscribe(msg.listUnsubscribe);
  const { data, error } = await adminDb
    .from("brands")
    .insert({
      user_id: userId,
      brand: msg.fromName || domain,
      brand_initials: initialsFor(msg.fromName || domain),
      category,
      source: "detected", // found in the inbox; we didn't subscribe them
      status: "active",
      sender_domain: domain,
      can_one_click_unsubscribe:
        msg.oneClickUnsubscribe && Boolean(unsub.http),
      unsubscribe_method: unsub.http || unsub.mailto ? unsub : null,
      last_offer_at: msg.date,
    })
    .select("id, status")
    .single();
  if (error) {
    // A concurrent insert may have won the unique(user_id,sender_domain) race;
    // re-read instead of failing the whole scan.
    const { data: retry } = await adminDb
      .from("brands")
      .select("id, status")
      .eq("user_id", userId)
      .eq("sender_domain", domain)
      .limit(1);
    return (retry?.[0] as BrandRef) ?? null;
  }
  return data as BrandRef;
}

interface ScanProgress {
  messages: number;
  offers: number;
  total: number;
}

/** Process a single message: extract → upsert brand + offers. Returns counts. */
async function processMessage(
  userId: string,
  msg: ParsedMessage,
  prefs: RankPreferences,
): Promise<{ offers: number; total: number }> {
  const offers = await extractOffers(msg);
  if (offers.length === 0) return { offers: 0, total: 0 };

  const brand = await findOrCreateBrand(userId, msg, offers[0]!.category);
  if (!brand || brand.status === "unsubscribed") return { offers: 0, total: 0 };

  const rows = offers.map((offer) => ({
    user_id: userId,
    brand_id: brand.id,
    tier: "personalized" as const,
    category: offer.category,
    title: offer.title,
    subtitle: offer.subtitle,
    savings_amount: offer.savingsAmount,
    savings_percent: offer.savingsPercent,
    original_price: offer.originalPrice,
    deal_price: offer.dealPrice,
    code: offer.code,
    expires_at: offer.expiresAt,
    terms: offer.terms,
    why_for_you: buildWhyForYou(offer, msg.fromName || msg.fromDomain, prefs),
    relevance_score: scoreOffer(offer, msg.fromName || msg.fromDomain, prefs),
    redeem_type: offer.redeemType,
    deal_url: offer.dealUrl,
    source_message_id: msg.messageId,
    dedup_hash: dedupHash(msg.fromDomain, offer),
  }));

  const { data: inserted, error } = await adminDb
    .from("offers")
    .upsert(rows, { onConflict: "user_id,dedup_hash", ignoreDuplicates: true })
    .select("savings_amount");
  if (error) throw new Error(error.message);

  const newRows = (inserted ?? []) as { savings_amount: number | string }[];
  const total = newRows.reduce(
    (s, r) =>
      s + (typeof r.savings_amount === "string" ? Number(r.savings_amount) : r.savings_amount),
    0,
  );
  // Freshen the brand's last-offer marker.
  if (newRows.length && msg.date) {
    await adminDb
      .from("brands")
      .update({ last_offer_at: msg.date })
      .eq("id", brand.id)
      .lt("last_offer_at", msg.date);
  }
  return { offers: newRows.length, total };
}

async function finalize(
  scanId: string,
  status: "done" | "error",
  progress: ScanProgress,
  error?: string,
): Promise<void> {
  await adminDb
    .from("scans")
    .update({
      status,
      messages_scanned: progress.messages,
      offers_found: progress.offers,
      found_total: Math.round(progress.total * 100) / 100,
      error: error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", scanId);
}

/** The async body. Never throws to the caller — errors land on the scan row. */
async function runScan(
  scanId: string,
  userId: string,
  prefs: RankPreferences,
): Promise<void> {
  const progress: ScanProgress = { messages: 0, offers: 0, total: 0 };
  try {
    await adminDb
      .from("scans")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", scanId);

    const conn = await getActiveGoogleConnection(userId);
    if (!conn) throw new Error("No active inbox connection");
    const token = await getFreshAccessToken(conn);

    const ids = await gmailProvider.listPromoMessageIds(token, {
      maxResults: config.scan.maxMessages,
      query: `newer_than:${config.scan.lookbackDays}d`,
    });

    await mapPool(ids, CONCURRENCY, async (id) => {
      try {
        const msg = await gmailProvider.getMessage(token, id);
        const r = await processMessage(userId, msg, prefs);
        progress.messages += 1;
        progress.offers += r.offers;
        progress.total += r.total;
        // Cheap progress beats — let the First Scan screen show movement.
        if (progress.messages % 10 === 0) {
          await adminDb
            .from("scans")
            .update({
              messages_scanned: progress.messages,
              offers_found: progress.offers,
              found_total: Math.round(progress.total * 100) / 100,
            })
            .eq("id", scanId);
        }
      } catch (err) {
        // One bad message shouldn't sink the scan.
        progress.messages += 1;
        void err;
      }
    });

    await markSynced(conn.id);
    await finalize(scanId, "done", progress);
  } catch (err) {
    await finalize(
      scanId,
      "error",
      progress,
      err instanceof Error ? err.message : "scan failed",
    );
  }
}

export interface StartScanResult {
  scanId: string;
}

/**
 * Create a scan row and kick off the async worker. Throws (handled by the route)
 * if the user has no connected inbox or extraction isn't configured.
 */
export async function startScan(
  userId: string,
  prefs: RankPreferences = NEUTRAL_PREFERENCES,
): Promise<StartScanResult> {
  if (!anthropicConfigured()) {
    throw new Error("Extraction is not configured (ANTHROPIC_API_KEY missing)");
  }
  const conn = await getActiveGoogleConnection(userId);
  if (!conn) throw new Error("No active inbox connection");

  const { data, error } = await adminDb
    .from("scans")
    .insert({ user_id: userId, connection_id: conn.id, status: "queued" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const scanId = (data as { id: string }).id;

  // Fire-and-forget; progress + completion are written to the scan row.
  void runScan(scanId, userId, prefs);

  return { scanId };
}

export interface ScanStatus {
  id: string;
  status: "queued" | "running" | "done" | "error";
  messagesScanned: number;
  offersFound: number;
  foundTotal: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export async function getScanStatus(
  userId: string,
  scanId: string,
): Promise<ScanStatus | null> {
  const { data, error } = await adminDb
    .from("scans")
    .select(
      "id, status, messages_scanned, offers_found, found_total, error, started_at, finished_at",
    )
    .eq("user_id", userId)
    .eq("id", scanId)
    .limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0] as
    | {
        id: string;
        status: ScanStatus["status"];
        messages_scanned: number;
        offers_found: number;
        found_total: number | string;
        error: string | null;
        started_at: string | null;
        finished_at: string | null;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    messagesScanned: row.messages_scanned,
    offersFound: row.offers_found,
    foundTotal:
      typeof row.found_total === "string" ? Number(row.found_total) : row.found_total,
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

// Exported for unit tests.
export const _internals = { dedupHash, parseUnsubscribe, initialsFor, mapPool };
