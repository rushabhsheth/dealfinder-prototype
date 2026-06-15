// Deal grading. PLACEHOLDER rules — isolated here so the real model (offer
// quality, user preferences, history, timing, …) can drop in later without
// touching the UI. Grading is payout-blind: it measures value to the user only.

import type { Deal } from "../types";

export type GradeLetter = "S" | "A" | "B" | "C" | "D";

export interface Grade {
  letter: GradeLetter;
  /** 0–100 composite, kept for future tuning / tooltips. */
  score: number;
  /** Short human verdict, used on the deal detail. */
  label: string;
  /** Tailwind tone classes for the badge fill + text. */
  tone: string;
}

const LABELS: Record<GradeLetter, string> = {
  S: "Exceptional — a top pick",
  A: "Great value for you",
  B: "Good value",
  C: "Fair value",
  D: "Modest value",
};

const TONES: Record<GradeLetter, string> = {
  // S gets the apricot hero pop so it clearly outranks the green A.
  S: "bg-gradient-to-br from-accent to-accent-pressed text-white",
  A: "bg-savings text-white",
  B: "bg-primary text-white",
  C: "bg-urgency text-[#5e4a12]",
  D: "bg-hairline text-ink-muted",
};

/**
 * Placeholder composite: blends fit (relevance) and savings depth. Personalized
 * deals weight fit; public deals (no relevance signal) lean on savings.
 */
export function gradeForDeal(deal: Deal): Grade {
  const savings = Math.min(deal.savingsPercent, 50) / 50; // 50%+ off saturates
  const relevance = deal.relevanceScore ?? null;

  const score =
    relevance != null
      ? Math.round((relevance * 0.6 + savings * 0.4) * 100)
      : Math.round((savings * 0.85 + 0.1) * 100);

  const letter: GradeLetter =
    score >= 88 ? "S" : score >= 75 ? "A" : score >= 60 ? "B" : score >= 45 ? "C" : "D";

  return { letter, score, label: LABELS[letter], tone: TONES[letter] };
}
