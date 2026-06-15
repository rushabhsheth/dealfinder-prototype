import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Lock,
  ArrowRight,
  PauseCircle,
  Mail,
} from "lucide-react";
import { personalizedDeals, publicDeals, CATEGORY_LABELS, savings } from "../lib/data";
import { usd } from "../lib/format";
import { useDemo } from "../state/DemoContext";
import DealCard from "../components/DealCard";
import CategoryChips from "../components/CategoryChips";
import BottomNav from "../components/BottomNav";
import HeaderMenu from "../components/HeaderMenu";

/**
 * Screens 2 + 9 + 14 — the unified Feed. One tab, two views via a segmented
 * toggle:
 *   • For You   — personalized, ranked deals found by scanning the inbox (hero).
 *                 Free tier sees a connect-your-inbox upsell instead.
 *   • All Deals — the universal public catalog, same for everyone, browseable.
 * Ranking stays payout-blind. Default view follows the tier.
 */
type View = "foryou" | "all";

export default function Feed() {
  const navigate = useNavigate();
  const { tier, downgraded } = useDemo();
  const isPremium = tier === "trial" || tier === "paid";

  const [view, setView] = useState<View>(isPremium ? "foryou" : "all");
  const [category, setCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const totalSavings = personalizedDeals.reduce((sum, d) => sum + d.savingsAmount, 0);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(publicDeals.map((d) => CATEGORY_LABELS[d.category])))],
    []
  );
  const visiblePublic = publicDeals.filter(
    (d) => category === "All" || CATEGORY_LABELS[d.category] === category
  );

  function pullToRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 bg-surface px-4 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-ink">Deals</h1>
          <div className="flex items-center gap-1">
            {view === "foryou" && isPremium && (
              <button
                onClick={pullToRefresh}
                aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-ink-muted active:bg-primary-tint"
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              </button>
            )}
            <HeaderMenu />
          </div>
        </div>

        {/* Segmented control */}
        <div className="mt-2 flex rounded-button bg-hairline/50 p-1">
          <Segment label="For You" active={view === "foryou"} onClick={() => setView("foryou")} />
          <Segment label="All Deals" active={view === "all"} onClick={() => setView("all")} />
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {view === "foryou" ? (
          isPremium ? (
            <ForYou refreshing={refreshing} tier={tier} totalSavings={totalSavings} navigate={navigate} />
          ) : (
            <ForYouLocked onStartTrial={() => navigate("/trial")} />
          )
        ) : (
          <AllDeals
            downgraded={downgraded}
            categories={categories}
            category={category}
            onCategory={setCategory}
            deals={visiblePublic}
            onResubscribe={() => navigate("/paywall")}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Segment({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-[10px] py-2 text-label font-semibold transition-colors ${
        active ? "bg-card text-ink shadow-card" : "text-ink-muted"
      }`}
    >
      {label}
    </button>
  );
}

/* ---- For You (premium): personalized ranked deals ---- */
function ForYou({
  refreshing,
  tier,
  totalSavings,
  navigate,
}: {
  refreshing: boolean;
  tier: string;
  totalSavings: number;
  navigate: (to: string) => void;
}) {
  return (
    <>
      <p className="py-2 text-caption text-ink-muted">
        <span className="nums font-semibold text-savings">{usd(totalSavings)}</span> in offers
        ranked for you · {personalizedDeals.length} live · found in your inbox
      </p>

      {refreshing && <p className="py-1 text-center text-caption text-ink-muted">Re-ranking…</p>}

      <div className="space-y-3">
        {personalizedDeals.map((deal, i) => (
          <div key={deal.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <DealCard deal={deal} showWhy={i < 3} />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-card border border-hairline bg-primary-tint/50 p-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-caption text-ink">
          Ranked by what's best for you — fit, savings, and expiry. Brands never pay to rank higher.
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
    </>
  );
}

/* ---- For You (free): connect-inbox upsell ---- */
function ForYouLocked({ onStartTrial }: { onStartTrial: () => void }) {
  return (
    <div className="flex flex-col items-center px-2 pt-10 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary-tint text-primary">
        <Mail size={36} strokeWidth={1.75} />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-accent text-white">
          <Sparkles size={14} />
        </span>
      </div>
      <h2 className="mt-5 text-h1 text-ink">Deals picked for you</h2>
      <p className="mt-2 max-w-xs text-body text-ink-muted">
        Connect your inbox and we'll scan it (read-only) for offers that fit you — ranked by what's
        worth it, never by who pays us.
      </p>

      <button
        onClick={onStartTrial}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-button bg-accent py-3.5 text-label font-semibold text-white active:bg-accent-pressed"
      >
        Start free trial <ArrowRight size={18} />
      </button>
      <p className="mt-2 flex items-center gap-1.5 text-caption text-ink-muted">
        <Lock size={13} /> Read-only · free for 14 days · cancel anytime
      </p>
    </div>
  );
}

/* ---- All Deals: public catalog ---- */
function AllDeals({
  downgraded,
  categories,
  category,
  onCategory,
  deals,
  onResubscribe,
}: {
  downgraded: boolean;
  categories: string[];
  category: string;
  onCategory: (c: string) => void;
  deals: typeof publicDeals;
  onResubscribe: () => void;
}) {
  return (
    <>
      {downgraded && (
        <div className="mb-3 mt-2 rounded-card border border-hairline bg-card p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-label font-semibold text-ink">
            <PauseCircle size={16} className="text-ink-muted" /> Premium is paused
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Your inbox is disconnected and fare watches are off. Resubscribe to bring back your
            personalized feed.
          </p>
          <button
            onClick={onResubscribe}
            className="mt-3 inline-flex items-center gap-1.5 rounded-button bg-accent px-4 py-2 text-label font-semibold text-white"
          >
            Resubscribe <ArrowRight size={16} />
          </button>
        </div>
      )}

      <p className="mb-2 mt-2 inline-flex items-center gap-1 text-caption text-ink-muted">
        <Lock size={12} /> Public deals · same for everyone
      </p>

      <div className="mb-3">
        <CategoryChips categories={categories} active={category} onChange={onCategory} />
      </div>

      <div className="space-y-3">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </>
  );
}
