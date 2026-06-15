import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, RefreshCw, ShieldCheck } from "lucide-react";
import { personalizedDeals, savings } from "../lib/data";
import { usd } from "../lib/format";
import { useDemo } from "../state/DemoContext";
import DealCard from "../components/DealCard";
import BottomNav from "../components/BottomNav";

/**
 * Screen 9 — Personalized Ranked Feed ⭐ (hero).
 * Ranked list of deals ordered by payout-blind relevance. Top items feel
 * hand-picked; each shows savings, expiry, urgency, and a "why you" line.
 */
export default function RankedFeed() {
  const navigate = useNavigate();
  const { tier } = useDemo();
  const [refreshing, setRefreshing] = useState(false);

  const totalSavings = personalizedDeals.reduce((sum, d) => sum + d.savingsAmount, 0);

  function pullToRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Hero header */}
      <header className="shrink-0 bg-surface px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
              <Sparkles size={14} /> For you · {tier === "trial" ? "Trial" : "Premium"}
            </p>
            <h1 className="mt-0.5 text-h1 text-ink">Your deals</h1>
          </div>
          <button
            onClick={pullToRefresh}
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-ink-muted active:bg-primary-tint"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <p className="mt-1.5 text-caption text-ink-muted">
          <span className="nums font-semibold text-savings">{usd(totalSavings)}</span> in offers
          ranked for you · {personalizedDeals.length} live
        </p>
      </header>

      {/* Ranked list */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {refreshing && (
          <p className="py-2 text-center text-caption text-ink-muted">Re-ranking…</p>
        )}

        <div className="space-y-3">
          {personalizedDeals.map((deal, i) => (
            <div key={deal.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <DealCard deal={deal} showWhy={i < 3} />
            </div>
          ))}
        </div>

        {/* Trust footer — ranking is payout-blind */}
        <div className="mt-5 flex items-start gap-2 rounded-card border border-hairline bg-primary-tint/50 p-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-caption text-ink">
            Ranked by what's best for you — fit, savings, and expiry. Brands never pay to rank
            higher.
          </p>
        </div>

        {tier === "trial" && (
          <button
            onClick={() => navigate("/paywall")}
            className="mt-4 w-full rounded-card border border-dashed border-accent bg-accent-tint/40 p-3 text-center text-label font-semibold text-accent-pressed"
          >
            {savings.trial.lengthDays - savings.trial.dayOfTrial} days left in your trial · See plan
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
