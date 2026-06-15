import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { savings, getDeal } from "../lib/data";
import { usd } from "../lib/format";
import DealCard from "../components/DealCard";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 8 — "Here's what we found you" Savings Summary.
 * The first proof of value inside the trial: big display number, count of
 * offers, top 3 highlighted, "See my feed".
 */
export default function SavingsSummary() {
  const navigate = useNavigate();
  const { firstScan } = savings;
  const topDeals = firstScan.topDealIds.map(getDeal).filter(Boolean);

  return (
    <div className="flex h-full flex-col">
      {/* Apricot hero — a spotlight moment */}
      <div className="shrink-0 bg-gradient-to-b from-accent-tint to-surface px-6 pb-6 pt-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-badge bg-card px-3 py-1 text-label font-semibold text-accent-pressed shadow-card">
          <Sparkles size={14} /> Your first scan is done
        </span>
        <p className="animate-fade-up mt-5 text-body text-ink">We found you</p>
        <p className="animate-fade-up nums text-[52px] font-bold leading-none text-savings">
          {usd(firstScan.foundTotal)}
        </p>
        <p className="animate-fade-up mt-2 text-body text-ink-muted">
          across <span className="font-semibold text-ink">{firstScan.offersFound} offers</span> —
          from{" "}
          <span className="nums font-semibold text-ink">
            {firstScan.scannedMessages.toLocaleString()}
          </span>{" "}
          messages scanned
        </p>
      </div>

      {/* Top 3 highlights */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Top picks for you
        </p>
        <div className="space-y-3">
          {topDeals.map((deal) => (
            <DealCard key={deal!.id} deal={deal!} compact />
          ))}
        </div>

        <p className="mt-5 text-center text-caption text-ink-muted">
          We'll keep scanning and only ping you when something's worth it.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        <PrimaryButton onClick={() => navigate("/feed")}>
          See my feed <ArrowRight size={18} />
        </PrimaryButton>
      </div>
    </div>
  );
}
