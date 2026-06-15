import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, ArrowRight, PauseCircle } from "lucide-react";
import { publicDeals, CATEGORY_LABELS } from "../lib/data";
import { useDemo } from "../state/DemoContext";
import DealCard from "../components/DealCard";
import CategoryChips from "../components/CategoryChips";
import BottomNav from "../components/BottomNav";
import HeaderMenu from "../components/HeaderMenu";

/**
 * Screen 2 — Free Open-Deals Feed (non-personalized public deals), and
 * Screen 14 — Downgraded Free Tier. Same feed; the banner changes: an upsell
 * for new free users, a "premium paused / resubscribe" notice post-trial.
 */
export default function FreeFeed() {
  const navigate = useNavigate();
  const { downgraded } = useDemo();
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(publicDeals.map((d) => CATEGORY_LABELS[d.category])))],
    []
  );

  const visible = publicDeals.filter(
    (d) => category === "All" || CATEGORY_LABELS[d.category] === category
  );

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 bg-surface px-4 pb-3 pt-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h1 text-ink">Open deals</h1>
            <p className="mt-0.5 inline-flex items-center gap-1 text-caption text-ink-muted">
              <Lock size={12} /> Public deals · same for everyone
            </p>
          </div>
          <HeaderMenu />
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {/* Banner: downgrade notice or upsell */}
        {downgraded ? (
          <div className="mb-3 rounded-card border border-hairline bg-card p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-label font-semibold text-ink">
              <PauseCircle size={16} className="text-ink-muted" /> Premium is paused
            </p>
            <p className="mt-1 text-caption text-ink-muted">
              Your inbox is disconnected and fare watches are off. Resubscribe to bring back your
              personalized feed.
            </p>
            <button
              onClick={() => navigate("/paywall")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-button bg-accent px-4 py-2 text-label font-semibold text-white"
            >
              Resubscribe <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/trial")}
            className="mb-3 w-full rounded-card bg-gradient-to-r from-accent to-accent-pressed p-4 text-left text-white shadow-card active:scale-[0.99]"
          >
            <p className="flex items-center gap-1.5 text-label font-semibold">
              <Sparkles size={16} /> Get deals just for you
            </p>
            <p className="mt-1 text-caption text-white/90">
              Connect your inbox and we'll find personalized savings — free for 14 days.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-label font-semibold">
              Start free trial <ArrowRight size={16} />
            </span>
          </button>
        )}

        <div className="mb-3">
          <CategoryChips categories={categories} active={category} onChange={setCategory} />
        </div>

        <div className="space-y-3">
          {visible.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
