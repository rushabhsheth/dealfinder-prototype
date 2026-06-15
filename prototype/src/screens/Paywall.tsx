import { useNavigate } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";
import { savings } from "../lib/data";
import { usd } from "../lib/format";
import { useDemo } from "../state/DemoContext";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 13 — Trial Recap + Paywall ⭐ (hero).
 * Apricot-accented. Leads with the cumulative savings recap, then the annual
 * price. Subscribe (accent) converts; "maybe later" downgrades to free.
 */
const BENEFITS = [
  "Personalized, ranked deal feed",
  "Inbox auto-scan for offers you'd miss",
  "A chat agent that finds deals on request",
  "Travel fare watches & drop alerts",
  "Auto-enroll in high-value newsletters",
];

export default function Paywall() {
  const navigate = useNavigate();
  const { goPremium, downgrade } = useDemo();
  const { trial, cumulative } = savings;

  function subscribe() {
    goPremium("paid");
    navigate("/subscribed");
  }

  function maybeLater() {
    downgrade();
    navigate("/free");
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-8">
        {/* Recap hero */}
        <div className="rounded-card bg-gradient-to-b from-accent to-accent-pressed p-6 text-center text-white shadow-card">
          <p className="text-label font-semibold uppercase tracking-wide text-white/80">
            Your 14-day trial
          </p>
          <p className="nums mt-2 text-display font-bold leading-none">
            {usd(cumulative.totalSaved)}
          </p>
          <p className="mt-1.5 text-body text-white/90">
            saved across {cumulative.dealsRedeemed} redeemed deals
          </p>
        </div>

        <h1 className="mt-6 text-center text-h1 text-ink">Keep Scout on the case</h1>
        <p className="mt-1.5 text-center text-body text-ink-muted">
          Your trial ends in {trial.lengthDays - trial.dayOfTrial} days. Stay premium to keep finding
          deals automatically.
        </p>

        {/* Benefits */}
        <div className="mt-5 space-y-2.5 rounded-card border border-hairline bg-card p-4 shadow-card">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-savings-tint text-savings">
                <Check size={13} strokeWidth={3} />
              </span>
              <span className="text-body text-ink">{b}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="mt-5 rounded-card border-2 border-accent bg-accent-tint/40 p-4 text-center">
          <p className="nums text-h1 text-ink">
            {usd(trial.annualPrice)}
            <span className="text-body font-normal text-ink-muted"> / year</span>
          </p>
          <p className="nums mt-0.5 text-caption text-ink-muted">
            just {usd(trial.monthlyEquivalent)}/mo — less than one deal usually saves you
          </p>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-caption text-ink-muted">
          <ShieldCheck size={14} className="text-primary" /> Cancel anytime. Disconnect your inbox in
          one tap.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        <PrimaryButton variant="accent" onClick={subscribe}>
          Subscribe · {usd(trial.annualPrice)}/yr
        </PrimaryButton>
        <button
          onClick={maybeLater}
          className="mt-1.5 w-full py-1.5 text-label font-semibold text-ink-muted"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
