import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Sparkles, ShieldCheck, ArrowRight, type LucideIcon } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 1 — Value Explainer. Swipeable intro panels: what DealFinder does and
 * the "we work for you, not the brands" trust promise. No signup wall.
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
  const last = i === PANELS.length - 1;

  return (
    <div className="flex h-full flex-col bg-surface px-6 pb-8 pt-6">
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/free")}
          className="text-label font-semibold text-ink-muted"
        >
          Skip
        </button>
      </div>

      {/* Panel */}
      <div key={i} className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-primary-tint text-primary">
          <panel.Icon size={48} strokeWidth={1.75} />
        </div>
        <h1 className="mt-8 text-h1 text-ink">{panel.title}</h1>
        <p className="mt-3 max-w-xs text-body text-ink-muted">{panel.body}</p>
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

      {/* Actions */}
      <div className="space-y-2">
        {last ? (
          <PrimaryButton onClick={() => navigate("/free")}>
            Browse deals <ArrowRight size={18} />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setI(i + 1)}>
            How it works <ArrowRight size={18} />
          </PrimaryButton>
        )}
        <button
          onClick={() => navigate("/free")}
          className="w-full py-2 text-label font-semibold text-primary"
        >
          Browse deals — no signup
        </button>
      </div>
    </div>
  );
}
