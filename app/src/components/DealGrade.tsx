import type { Deal } from "../types";
import { gradeForDeal } from "../lib/grade";

/**
 * DealGrade — a calm letter-grade stamp (A–D) signalling how good this offer is
 * for the user. Placeholder scoring lives in lib/grade.ts. Never reflects payout.
 */
export default function DealGrade({ deal, size = "sm" }: { deal: Deal; size?: "sm" | "lg" }) {
  const { letter, tone } = gradeForDeal(deal);
  const dim = size === "lg" ? "h-9 w-9 text-h2" : "h-7 w-7 text-label";
  return (
    <span
      aria-label={`Deal grade ${letter}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-bold ${dim} ${tone}`}
    >
      {letter}
    </span>
  );
}
