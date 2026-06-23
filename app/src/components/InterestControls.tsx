import { ThumbsUp, ThumbsDown, CircleDashed } from "lucide-react";
import type { DealInterest } from "../types";
import { useDemo } from "../state/DemoContext";

/**
 * InterestControls — a three-way signal row beneath a DealCard letting the user
 * mark an offer Interested / Maybe / Not for me. Rendered as a sibling of the
 * card (never nested inside it — the card is itself a button). Tapping the
 * active option again clears it. Persisted on DemoContext for demo continuity.
 */
const OPTIONS: {
  value: DealInterest;
  label: string;
  Icon: typeof ThumbsUp;
  active: string;
}[] = [
  {
    value: "interested",
    label: "Interested",
    Icon: ThumbsUp,
    active: "border-savings bg-savings-tint text-savings",
  },
  {
    value: "maybe",
    label: "Maybe",
    Icon: CircleDashed,
    active: "border-urgency bg-urgency/25 text-[#5e4a12]",
  },
  {
    value: "not",
    label: "Not for me",
    Icon: ThumbsDown,
    active: "border-hairline bg-hairline/60 text-ink-muted",
  },
];

export default function InterestControls({
  dealId,
  compact = false,
}: {
  dealId: string;
  /** Icon-only buttons for dense rows (e.g. offers listed on a brand card). */
  compact?: boolean;
}) {
  const { getInterest, setInterest } = useDemo();
  const current = getInterest(dealId);

  if (compact) {
    return (
      <div className="flex gap-1">
        {OPTIONS.map(({ value, label, Icon, active }) => {
          const on = current === value;
          return (
            <button
              key={value}
              onClick={() => setInterest(dealId, on ? null : value)}
              aria-label={label}
              aria-pressed={on}
              className={`flex h-7 w-8 items-center justify-center rounded-md border transition-colors ${
                on ? active : "border-hairline bg-card text-ink-muted active:bg-hairline/30"
              }`}
            >
              <Icon size={14} strokeWidth={2.25} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex gap-1.5">
      {OPTIONS.map(({ value, label, Icon, active }) => {
        const on = current === value;
        return (
          <button
            key={value}
            onClick={() => setInterest(dealId, on ? null : value)}
            aria-pressed={on}
            className={`flex flex-1 items-center justify-center gap-1 rounded-button border py-1.5 text-caption font-semibold transition-colors ${
              on ? active : "border-hairline bg-card text-ink-muted active:bg-hairline/30"
            }`}
          >
            <Icon size={14} strokeWidth={2.25} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
