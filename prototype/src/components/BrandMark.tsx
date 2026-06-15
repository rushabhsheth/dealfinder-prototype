import type { DealCategory } from "../types";

/**
 * Neutral placeholder brand mark (DESIGN_SYSTEM.md: real-feeling marks, but use
 * neutral placeholders in the prototype). A soft, category-tinted monogram —
 * never used to imply a deal is sponsored or boosted.
 */
const CATEGORY_TINT: Record<DealCategory, { bg: string; fg: string }> = {
  travel: { bg: "bg-primary-tint", fg: "text-primary-pressed" },
  retail: { bg: "bg-accent-tint", fg: "text-accent-pressed" },
  dining: { bg: "bg-savings-tint", fg: "text-savings" },
  tech: { bg: "bg-[#EFE7D6]", fg: "text-ink" },
};

interface Props {
  initials: string;
  category: DealCategory;
  size?: number;
}

export default function BrandMark({ initials, category, size = 48 }: Props) {
  const tint = CATEGORY_TINT[category];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl font-bold ${tint.bg} ${tint.fg}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
