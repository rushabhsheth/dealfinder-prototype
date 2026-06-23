import { savings } from "../lib/data";
import { useDemo } from "../state/DemoContext";

/**
 * TierBadge — the shared entitlement pill surfaced in the desktop account
 * dropdown trigger and the mobile drawer header: Free · Trial (N days left) ·
 * Premium. Purely presentational (a <span>) so it can be safely nested inside
 * the account-menu trigger button — the upgrade path lives in the menu itself.
 */
export default function TierBadge({ className = "" }: { className?: string }) {
  const { tier } = useDemo();

  if (tier === "paid") {
    return <Pill className={`bg-primary text-white ${className}`}>Premium</Pill>;
  }
  if (tier === "trial") {
    const daysLeft = Math.max(0, savings.trial.lengthDays - savings.trial.dayOfTrial);
    return (
      <Pill className={`bg-accent-tint text-accent-pressed ${className}`}>
        Trial · {daysLeft} {daysLeft === 1 ? "day" : "days"} left
      </Pill>
    );
  }
  return <Pill className={`bg-hairline/60 text-ink-muted ${className}`}>Free</Pill>;
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-badge px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
