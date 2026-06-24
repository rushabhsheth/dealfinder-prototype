import { usd } from "../lib/format";

interface Props {
  /** Dollars saved. When 0/unknown we fall back to the percent. */
  amount?: number;
  percent?: number;
  size?: "sm" | "md";
}

/**
 * SavingsBadge — savings tint fill, savings-green text. Shows "$X" and/or
 * "X% off". Savings always renders in --savings-600 (DESIGN_SYSTEM.md).
 */
export default function SavingsBadge({ amount = 0, percent, size = "md" }: Props) {
  const pct = percent ? Math.round(percent) : 0;
  const parts: string[] = [];
  if (amount > 0) parts.push(`Save ${usd(amount)}`);
  if (pct > 0) parts.push(amount > 0 ? `(${pct}% off)` : `${pct}% off`);
  const label = parts.join(" ") || "Deal";

  const pad = size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-label";
  return (
    <span
      className={`nums inline-flex items-center rounded-badge bg-savings-tint font-semibold text-savings ${pad}`}
    >
      {label}
    </span>
  );
}
