import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 1 — Value Explainer. Swipeable intro panels (navigated with the
 * left/right arrows or dots), then one CTA into the onboarding flow.
 */
interface Panel {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const PANELS: Panel[] = [
  {
    Icon: Mail,
    title: "Deals hide in your inbox",
    body: "Newsletters, receipts, and offers pile up. DealFinder reads them so you don't have to — and surfaces the few that matter.",
  },
  {
    Icon: Sparkles,
    title: "Ranked just for you",
    body: "We learn what you buy and where you travel, then rank real savings — dollars off, percent off, ending soon — by what fits your life.",
  },
  {
    Icon: ShieldCheck,
    title: "We work for you, not brands",
    body: "Read-only access. Ranking is never influenced by payout. Disconnect and delete your data anytime.",
  },
];

export default function ValueExplainer() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const panel = PANELS[i];
  const atStart = i === 0;
  const atEnd = i === PANELS.length - 1;

  return (
    <div className="pb-8 pt-6">
      {/* Panel with arrow navigation */}
      <div className="flex items-center gap-1">
        <ArrowButton dir="left" disabled={atStart} onClick={() => setI(i - 1)} />
        <div
          key={i}
          className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-primary-tint text-primary">
            <panel.Icon size={48} strokeWidth={1.75} />
          </div>
          <h1 className="mt-8 text-h1 text-ink">{panel.title}</h1>
          <p className="mt-3 max-w-xs text-body text-ink-muted">{panel.body}</p>
        </div>
        <ArrowButton dir="right" disabled={atEnd} onClick={() => setI(i + 1)} />
      </div>

      {/* Dots */}
      <div className="mb-6 flex justify-center gap-2">
        {PANELS.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Panel ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-primary" : "w-2 bg-hairline"
            }`}
          />
        ))}
      </div>

      {/* Single CTA into onboarding */}
      <PrimaryButton onClick={() => navigate("/trial")}>
        Start finding deals <ArrowRight size={18} />
      </PrimaryButton>
    </div>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={dir === "left" ? "Previous" : "Next"}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-ink shadow-card transition active:scale-95 ${
        disabled ? "pointer-events-none opacity-30" : ""
      }`}
    >
      <Icon size={22} />
    </button>
  );
}
