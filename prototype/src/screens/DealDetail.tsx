import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Copy, Check, ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
import { getDeal } from "../lib/data";
import { expiryLabel, isUrgent, usd } from "../lib/format";
import { gradeForDeal } from "../lib/grade";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import TopBar from "../components/TopBar";
import BrandMark from "../components/BrandMark";
import SavingsBadge from "../components/SavingsBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import DealGrade from "../components/DealGrade";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 10 — Deal Detail + Redeem ⭐ (hero).
 * Structured offer: brand, discount, promo code (copy), expiry, full terms,
 * "why this is a good deal", and one-tap Redeem / Book.
 */
export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const deal = getDeal(id);
  const { redeem, hasRedeemed } = useDemo();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!deal) {
    return (
      <div className="flex h-full flex-col">
        <TopBar back title="Deal" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-body text-ink-muted">
          This deal is no longer available.
        </div>
      </div>
    );
  }

  const redeemed = hasRedeemed(deal.id);

  function copyCode() {
    if (!deal?.code) return;
    navigator.clipboard?.writeText(deal.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.show(`Code ${deal.code} copied`);
  }

  function onRedeem() {
    if (!deal) return;
    redeem(deal.id);
    if (deal.redeemType === "code") {
      copyCode();
    } else {
      toast.show(deal.redeemType === "book" ? "Opening booking…" : "Opening deal…");
    }
  }

  const ctaLabel =
    deal.redeemType === "book"
      ? "Book this rate"
      : deal.redeemType === "link"
        ? "Open deal"
        : "Copy code & redeem";

  return (
    <div className="flex h-full flex-col">
      <TopBar back title={deal.brand} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28">
        {/* Header block */}
        <div className="flex items-start gap-3 pt-2">
          <BrandMark initials={deal.brandInitials} category={deal.category} size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              {deal.brand}
            </p>
            <h1 className="mt-0.5 text-h1 text-ink">{deal.title}</h1>
            <p className="mt-0.5 text-body text-ink-muted">{deal.subtitle}</p>
          </div>
        </div>

        {/* Savings + urgency */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SavingsBadge amount={deal.savingsAmount} percent={deal.savingsPercent} />
          {isUrgent(deal.expiresAt) ? (
            <UrgencyBadge expiresAt={deal.expiresAt} />
          ) : (
            <span className="rounded-badge bg-card px-2.5 py-1 text-caption text-ink-muted">
              {expiryLabel(deal.expiresAt)}
            </span>
          )}
        </div>

        {/* Deal grade */}
        <div className="mt-4 flex items-center gap-3 rounded-card border border-hairline bg-card p-3.5 shadow-card">
          <DealGrade deal={deal} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-label font-semibold text-ink">
              Deal grade {gradeForDeal(deal).letter} · {gradeForDeal(deal).label}
            </p>
            <p className="text-caption text-ink-muted">
              Scored on fit, savings, and timing — never on what a brand pays.
            </p>
          </div>
        </div>

        {/* Price comparison */}
        {deal.originalPrice != null && deal.dealPrice != null && (
          <div className="mt-4 flex items-end gap-3 rounded-card border border-hairline bg-card p-4 shadow-card">
            <div>
              <p className="text-caption text-ink-muted">Deal price</p>
              <p className="nums text-display text-savings">{usd(deal.dealPrice)}</p>
            </div>
            <p className="nums mb-1.5 text-body text-ink-muted line-through">
              {usd(deal.originalPrice)}
            </p>
          </div>
        )}

        {/* Promo code */}
        {deal.code && (
          <div className="mt-4">
            <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Promo code
            </p>
            <button
              onClick={copyCode}
              className="flex w-full items-center justify-between rounded-card border-2 border-dashed border-primary bg-primary-tint/40 px-4 py-3.5 active:scale-[0.99]"
            >
              <span className="nums text-h2 tracking-wider text-primary-pressed">{deal.code}</span>
              <span className="flex items-center gap-1.5 text-label font-semibold text-primary">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
        )}

        {/* Why this is a good deal */}
        {deal.whyForYou && (
          <div className="mt-4 flex items-start gap-2 rounded-card bg-primary-tint/50 p-3.5">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-label font-semibold text-primary-pressed">Why this is a good deal</p>
              <p className="mt-0.5 text-caption text-ink">{deal.whyForYou}</p>
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="mt-4">
          <p className="mb-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Terms
          </p>
          <p className="text-caption leading-relaxed text-ink-muted">{deal.terms}</p>
        </div>

        {/* Trust line */}
        <p className="mt-4 flex items-center gap-1.5 text-caption text-ink-muted">
          <ShieldCheck size={14} className="text-primary" /> Surfaced because it fits you — not
          because anyone paid for placement.
        </p>
      </div>

      {/* Sticky redeem CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        {redeemed ? (
          <div className="flex items-center justify-center gap-2 rounded-button bg-savings-tint py-3 text-label font-semibold text-savings">
            <Check size={18} strokeWidth={3} /> Redeemed · saved {usd(deal.savingsAmount)}
          </div>
        ) : (
          <PrimaryButton onClick={onRedeem}>
            {deal.redeemType === "code" ? <Copy size={18} /> : <ExternalLink size={18} />}
            {ctaLabel}
          </PrimaryButton>
        )}
        <button
          onClick={() => navigate(-1)}
          className="mt-1.5 w-full py-1.5 text-label font-semibold text-ink-muted"
        >
          Back to feed
        </button>
      </div>
    </div>
  );
}
