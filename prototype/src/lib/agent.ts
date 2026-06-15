// Mock conversational agent. No backend / no LLM (CLAUDE.md hard rule) — a small
// rule-based responder over the mock deal data that feels like a savings agent.

import { personalizedDeals, savings, watches } from "./data";
import { usd, expiryLabel } from "./format";

export interface AgentReply {
  text: string;
  /** Optional deal to surface as a tappable card under the message. */
  dealId?: string;
  /** Suggested follow-up prompts shown as chips. */
  followups?: string[];
}

const DEFAULT_FOLLOWUPS = [
  "Find a flight deal",
  "What's ending soon?",
  "How much have I saved?",
];

export const GREETING: AgentReply = {
  text: "Hi — I'm your DealFinder agent. I scan, rank, and track deals for you. What can I find?",
  followups: DEFAULT_FOLLOWUPS,
};

export function agentReply(input: string): AgentReply {
  const q = input.toLowerCase();

  if (/(flight|fly|fare|airfare|travel|trip|vacation|airport)/.test(q)) {
    const d = personalizedDeals.find((x) => x.category === "travel")!;
    const alert = watches.find((w) => w.status === "alert");
    return {
      text: `Your best flight deal right now is ${d.brand} — ${d.title}, saving ${usd(
        d.savingsAmount
      )} (${d.savingsPercent}% off).${
        alert
          ? ` I'm also watching ${alert.origin}→${alert.destination}: now ${usd(
              alert.currentPrice
            )}, below your ${usd(alert.targetPrice)} target.`
          : ""
      }`,
      dealId: d.id,
      followups: ["What's ending soon?", "How much have I saved?"],
    };
  }

  if (/(saved|saving|how much|spent|total)/.test(q)) {
    const c = savings.cumulative;
    return {
      text: `You've saved ${usd(c.totalSaved)} so far across ${c.dealsRedeemed} redeemed deals — averaging ${c.averageSavingPercent}% off. Most of it (${usd(
        c.byCategory[0].saved
      )}) came from travel.`,
      followups: ["Show my top deal", "What's ending soon?"],
    };
  }

  if (/(ending|expir|soon|today|urgent|last chance|deadline)/.test(q)) {
    const d = [...personalizedDeals].sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))[0];
    return {
      text: `Closest to expiring: ${d.brand} — ${d.title}, ${expiryLabel(
        d.expiresAt
      ).toLowerCase()}. It's worth ${usd(d.savingsAmount)}. Want to open it?`,
      dealId: d.id,
      followups: ["Find a flight deal", "How much have I saved?"],
    };
  }

  if (/(coffee|food|eat|dining|lunch|restaurant|meal)/.test(q)) {
    const d = personalizedDeals.find((x) => x.category === "dining")!;
    return {
      text: `For dining, ${d.brand} has ${d.title} — ${d.savingsPercent}% off, ${expiryLabel(
        d.expiresAt
      ).toLowerCase()}.`,
      dealId: d.id,
      followups: ["What's ending soon?", "How much have I saved?"],
    };
  }

  if (/(best|top|recommend|good deal|show|pick|suggest)/.test(q)) {
    const d = personalizedDeals[0];
    return {
      text: `My top pick for you is ${d.brand} — ${d.title}. ${
        d.whyForYou ?? ""
      } It saves ${usd(d.savingsAmount)} (${d.savingsPercent}% off).`,
      dealId: d.id,
      followups: ["What's ending soon?", "Find a flight deal"],
    };
  }

  const total = personalizedDeals.reduce((s, d) => s + d.savingsAmount, 0);
  return {
    text: `I've lined up ${personalizedDeals.length} deals worth ${usd(
      total
    )} for you. Ask me for a flight deal, what's ending soon, or how much you've saved.`,
    followups: DEFAULT_FOLLOWUPS,
  };
}
