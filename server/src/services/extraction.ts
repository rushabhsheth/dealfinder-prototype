// Named import (NOT default): the SDK's `export { Anthropic as default }`
// re-export resolves to the bare module namespace under some module-resolution
// setups (e.g. Vercel's Linux build), which is neither constructable nor usable
// as a type. The named `Anthropic` is the real class+namespace merge and
// resolves correctly across CJS/ESM, so `new Anthropic()`, `: Anthropic`, and
// `Anthropic.Tool` / `.Message` / `.ToolUseBlock` all work.
import { Anthropic } from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config.js";
import type { ParsedMessage } from "./provider.js";

/**
 * LLM structured extraction (PRD §7). Turns one parsed promo email into zero or
 * more STRUCTURED offers — never free text, never the raw email. We force a
 * single tool call whose input is validated against a strict schema, so a
 * malformed model response is rejected rather than trusted.
 *
 * Trust rules baked in here:
 *  - Extract only CONCRETE, redeemable offers actually present in the email.
 *    No invented codes, prices, or discounts. If there's no real offer → [].
 *  - We do NOT ask the model for a ranking/relevance score. Ranking is computed
 *    deterministically and payout-blind in ranking.ts — the model never sees or
 *    influences ordering, and there is no affiliate/commission input anywhere.
 *  - Savings are conservative; if a number isn't stated, it's left null/0.
 */

const CATEGORIES = ["travel", "retail", "dining", "tech"] as const;
const REDEEM_TYPES = ["code", "book", "link"] as const;

const ExtractedOfferSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(160).default(""),
  savingsAmount: z.number().min(0).default(0),
  savingsPercent: z.number().min(0).max(100).default(0),
  originalPrice: z.number().min(0).nullable().default(null),
  dealPrice: z.number().min(0).nullable().default(null),
  code: z.string().max(40).nullable().default(null),
  expiresAt: z.string().nullable().default(null), // ISO date or null
  terms: z.string().max(400).default(""),
  redeemType: z.enum(REDEEM_TYPES).default("link"),
  dealUrl: z.string().default(""),
});

export type ExtractedOffer = z.infer<typeof ExtractedOfferSchema>;

const ResultSchema = z.object({ offers: z.array(ExtractedOfferSchema).max(8) });

/** JSON Schema mirror of the zod shape, for the Anthropic tool definition. */
const OFFER_TOOL: Anthropic.Tool = {
  name: "record_offers",
  description:
    "Record the concrete, redeemable promotional offers found in this email. " +
    "Return an empty array if the email contains no real, actionable deal.",
  input_schema: {
    type: "object",
    properties: {
      offers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string", enum: [...CATEGORIES] },
            title: { type: "string", description: "Short offer headline" },
            subtitle: { type: "string" },
            savingsAmount: {
              type: "number",
              description: "Dollars saved, if stated; else 0",
            },
            savingsPercent: {
              type: "number",
              description: "Percent off, if stated; else 0",
            },
            originalPrice: { type: ["number", "null"] },
            dealPrice: { type: ["number", "null"] },
            code: {
              type: ["string", "null"],
              description: "Promo code to copy, if present",
            },
            expiresAt: {
              type: ["string", "null"],
              description: "Expiry as ISO 8601 date, if stated; else null",
            },
            terms: { type: "string" },
            redeemType: {
              type: "string",
              enum: [...REDEEM_TYPES],
              description:
                "'code' if a promo code, 'book' for travel bookings, else 'link'",
            },
            dealUrl: {
              type: "string",
              description: "Best landing/redemption URL from the email, if any",
            },
          },
          required: ["category", "title", "redeemType"],
        },
      },
    },
    required: ["offers"],
  },
};

const SYSTEM_PROMPT = [
  "You extract structured shopping/travel deals from a single promotional email.",
  "Only record offers that are concrete and redeemable by the recipient — a real",
  "discount, code, sale, or fare. Do NOT invent codes, prices, or percentages: if",
  "a value isn't explicitly in the email, leave it null or 0. If the email has no",
  "real actionable offer (pure branding, account notices, surveys), return an empty",
  "offers array. Be conservative — a defensible savings number matters more than a",
  "big one. Categorize each offer as travel, retail, dining, or tech.",
].join(" ");

function buildUserPrompt(msg: ParsedMessage): string {
  return [
    `From: ${msg.fromName} <${msg.fromEmail}>`,
    `Subject: ${msg.subject}`,
    "",
    msg.bodyText || msg.snippet,
  ].join("\n");
}

let cachedClient: Anthropic | null = null;
function defaultClient(): Anthropic {
  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  cachedClient ??= new Anthropic({ apiKey: config.anthropicApiKey });
  return cachedClient;
}

/** Pull the `record_offers` tool input out of a messages response & validate it. */
export function parseOffersFromResponse(
  msg: Anthropic.Message,
): ExtractedOffer[] {
  const toolUse = msg.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === "record_offers",
  );
  if (!toolUse) return [];
  const parsed = ResultSchema.safeParse(toolUse.input);
  if (!parsed.success) return [];
  return parsed.data.offers;
}

export interface ExtractDeps {
  client?: Anthropic;
  model?: string;
}

/**
 * Extract offers from one parsed message. `deps` lets tests inject a fake client
 * (and avoids any network in unit tests).
 */
export async function extractOffers(
  message: ParsedMessage,
  deps: ExtractDeps = {},
): Promise<ExtractedOffer[]> {
  const client = deps.client ?? defaultClient();
  const response = await client.messages.create({
    model: deps.model ?? config.anthropicModel,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [OFFER_TOOL],
    tool_choice: { type: "tool", name: "record_offers" },
    messages: [{ role: "user", content: buildUserPrompt(message) }],
  });
  return parseOffersFromResponse(response);
}

// Exported for unit tests.
export const _internals = { buildUserPrompt, ExtractedOfferSchema, ResultSchema };
