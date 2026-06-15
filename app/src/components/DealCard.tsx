import { useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import type { Deal } from "../types";
import { expiryLabel, isUrgent, usd } from "../lib/format";
import { useDemo } from "../state/DemoContext";
import BrandMark from "./BrandMark";
import SavingsBadge from "./SavingsBadge";
import UrgencyBadge from "./UrgencyBadge";

interface Props {
  deal: Deal;
  /** Show the "why you're seeing this" line (personalized feed only). */
  showWhy?: boolean;
  /** Compact variant for highlight lists (e.g. savings summary). */
  compact?: boolean;
}

/**
 * DealCard — white card on the sand surface. Brand mark, title, savings line in
 * green, expiry caption, optional urgency badge. Whole card taps into detail.
 */
export default function DealCard({ deal, showWhy = false, compact = false }: Props) {
  const navigate = useNavigate();
  const { hasRedeemed } = useDemo();
  const redeemed = hasRedeemed(deal.id);

  return (
    <button
      onClick={() => navigate(`/deal/${deal.id}`)}
      className="w-full rounded-card border border-hairline bg-card p-4 text-left shadow-card transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <BrandMark initials={deal.brandInitials} category={deal.category} size={compact ? 40 : 48} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-caption font-semibold uppercase tracking-wide text-ink-muted">
              {deal.brand}
            </span>
            {redeemed && (
              <span className="inline-flex items-center gap-0.5 rounded-badge bg-savings-tint px-1.5 py-0.5 text-[11px] font-semibold text-savings">
                <Check size={11} strokeWidth={3} /> Redeemed
              </span>
            )}
          </div>

          <h3 className="mt-0.5 truncate text-h2 text-ink">{deal.title}</h3>
          {!compact && (
            <p className="mt-0.5 truncate text-caption text-ink-muted">{deal.subtitle}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SavingsBadge amount={deal.savingsAmount} percent={deal.savingsPercent} size="sm" />
            {isUrgent(deal.expiresAt) ? (
              <UrgencyBadge expiresAt={deal.expiresAt} />
            ) : (
              <span className="text-caption text-ink-muted">{expiryLabel(deal.expiresAt)}</span>
            )}
          </div>

          {showWhy && deal.whyForYou && (
            <p className="mt-2.5 border-t border-hairline pt-2 text-caption text-ink-muted">
              <span className="font-semibold text-primary">Why you: </span>
              {deal.whyForYou}
            </p>
          )}
        </div>

        {compact && (
          <div className="flex shrink-0 flex-col items-end gap-1 pl-1">
            {deal.savingsAmount > 0 && (
              <span className="nums text-h2 text-savings">{usd(deal.savingsAmount)}</span>
            )}
            <ChevronRight size={18} className="text-ink-muted" />
          </div>
        )}
      </div>
    </button>
  );
}
