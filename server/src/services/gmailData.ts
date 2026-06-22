import type { EmailProvider, ListOptions, ParsedMessage } from "./provider.js";

/**
 * Gmail data access (read-only). Plain `fetch` against the Gmail REST API, same
 * as the OAuth handshake in google.ts — no googleapis SDK needed.
 *
 * HARD RULE: this only ever READS. We never call any modify/send endpoint. The
 * connected token is `gmail.readonly`, which Google enforces server-side too.
 *
 * Data minimization (PRD §8): we pull a bounded set of PROMOTIONS-category
 * messages, parse out sender + subject + a tag-stripped, length-capped body, and
 * the List-Unsubscribe header. The raw MIME is never persisted — only the parsed
 * shape is handed to extraction, and only structured offers are stored.
 */

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// Cap body text handed to the LLM — promos front-load the offer, and this bounds
// token cost and avoids storing more than we need in memory.
const MAX_BODY_CHARS = 8_000;

interface GmailHeader {
  name: string;
  value: string;
}
interface GmailPart {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}
interface GmailMessage {
  id: string;
  snippet?: string;
  payload?: GmailPart;
}

async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

function header(headers: GmailHeader[] | undefined, name: string): string | null {
  const h = headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? null;
}

/** "Patagonia <news@email.patagonia.com>" → { name, email, domain }. */
function parseFrom(from: string | null): {
  name: string;
  email: string;
  domain: string;
} {
  if (!from) return { name: "", email: "", domain: "" };
  const match = from.match(/^(.*?)<([^>]+)>$/);
  const name = (match?.[1] ?? "").trim().replace(/^"|"$/g, "");
  const email = (match?.[2] ?? from).trim().toLowerCase();
  const at = email.lastIndexOf("@");
  let domain = at >= 0 ? email.slice(at + 1) : "";
  // Collapse common bulk-mail subdomains so "email.patagonia.com" groups with
  // "patagonia.com" as one brand. Heuristic: keep the last two labels.
  const labels = domain.split(".");
  if (labels.length > 2) domain = labels.slice(-2).join(".");
  return { name: name || email.split("@")[0] || "", email, domain };
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Walk the MIME tree, preferring text/plain, falling back to stripped HTML. */
function extractBody(payload: GmailPart | undefined): string {
  if (!payload) return "";
  let plain = "";
  let html = "";

  const walk = (part: GmailPart) => {
    const mime = part.mimeType ?? "";
    if (mime === "text/plain" && part.body?.data && !plain) {
      plain = decodeBase64Url(part.body.data);
    } else if (mime === "text/html" && part.body?.data && !html) {
      html = decodeBase64Url(part.body.data);
    }
    part.parts?.forEach(walk);
  };
  walk(payload);

  const text = plain || (html ? stripHtml(html) : "");
  return text.slice(0, MAX_BODY_CHARS);
}

export const gmailProvider: EmailProvider = {
  async listPromoMessageIds(
    accessToken: string,
    opts: ListOptions,
  ): Promise<string[]> {
    const q = ["category:promotions", opts.query].filter(Boolean).join(" ");
    const params = new URLSearchParams({
      maxResults: String(opts.maxResults),
      q,
    });
    const json = await gmailGet<{ messages?: { id: string }[] }>(
      accessToken,
      `/messages?${params.toString()}`,
    );
    return (json.messages ?? []).map((m) => m.id);
  },

  async getMessage(accessToken: string, id: string): Promise<ParsedMessage> {
    const msg = await gmailGet<GmailMessage>(
      accessToken,
      `/messages/${id}?format=full`,
    );
    const headers = msg.payload?.headers;
    const from = parseFrom(header(headers, "From"));
    const listUnsub = header(headers, "List-Unsubscribe");
    const listUnsubPost = header(headers, "List-Unsubscribe-Post");
    const dateRaw = header(headers, "Date");

    return {
      messageId: msg.id,
      fromName: from.name,
      fromEmail: from.email,
      fromDomain: from.domain,
      subject: header(headers, "Subject") ?? "",
      snippet: msg.snippet ?? "",
      bodyText: extractBody(msg.payload),
      listUnsubscribe: listUnsub,
      oneClickUnsubscribe: Boolean(
        listUnsubPost && /one-click/i.test(listUnsubPost),
      ),
      date: dateRaw ? safeIso(dateRaw) : null,
    };
  },
};

function safeIso(date: string): string | null {
  const t = Date.parse(date);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

// Exported for unit testing the pure parsing helpers.
export const _internals = { parseFrom, stripHtml, extractBody };
