import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Copy, Check, ExternalLink, Sparkles, ShieldCheck, ArrowLeft } from "lucide-react";
import { loadDeal } from "../lib/data";
import { backendEnabled, redeemOffer } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { expiryLabel, isUrgent, usd } from "../lib/format";
import { gradeForDeal } from "../lib/grade";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import type { Deal } from "../types";
import BrandMark from "../components/BrandMark";
import SavingsBadge from "../components/SavingsBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import DealGrade from "../components/DealGrade";
import PrimaryButton from "../components/PrimaryButton";
import ScreenState from "../components/ScreenState";

/**
 * Screen 10 — Deal Detail + Redeem ⭐ (hero). Responsive (RESPONSIVE_WEB_PRD.md
 * §6): mobile = single column with a sticky bottom redeem CTA; desktop = two
 * columns with the redeem panel + grade + "why this is a good deal" as a sticky
 * right sidebar (evidence-first, the analog of Going's price-history panel).
 */
export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetcher = useCallback(() => loadDeal(id), [id]);
  const { data: deal, loading, error, reload } = useAsync<Deal | undefined>(fetcher);
  const { redeem, hasRedeemed } = useDemo();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const back = (
    <button
      onClick={() => navigate(-1)}
      className="mb-4 inline-flex items-center gap-1.5 text-label font-semibold text-ink-muted transition-colors hover:text-ink"
    >
      <ArrowLeft size={16} /> Back to deals
    </button>
  );

  if (loading) {
    return (
      <div>
        {back}
        <ScreenState variant="loading" />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {back}
        <ScreenState variant="error" message={error} onRetry={reload} />
      </div>
    );
  }
  if (!deal) {
    return (
      <div>
        {back}
        <p className="px-6 py-12 text-center text-body text-ink-muted">
          This deal is no longer available.
        </p>
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
    if (backendEnabled) {
      redeemOffer(deal.id).catch(() => {});
    }
    if (deal.redeemType === "code") {
      copyCode();
    } else {
      if (deal.dealUrl) window.open(deal.dealUrl, "_blank", "noopener");
      toast.show(deal.redeemType === "book" ? "Opening booking…" : "Opening deal…");
    }
  }

  // Re-open the deal / re-copy the code after redeeming, without re-counting the
  // savings — so marking it redeemed isn't a dead end if you didn't buy yet.
  function reopen() {
    if (!deal) return;
    if (deal.redeemType === "code") {
      copyCode();
    } else if (deal.dealUrl) {
      window.open(deal.dealUrl, "_blank", "noopener");
      toast.show(deal.redeemType === "book" ? "Opening booking…" : "Opening deal…");
    }
  }

  const ctaLabel =
    deal.redeemType === "book"
      ? "Book this rate"
      : deal.redeemType === "link"
        ? "Open deal"
        : "Copy code & redeem";

  const reopenLabel =
    deal.redeemType === "code"
      ? "Copy code again"
      : deal.redeemType === "book"
        ? "Open booking again"
        : "Open deal again";

  const redeemControl = redeemed ? (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 rounded-button bg-savings-tint py-3 text-label font-semibold text-savings">
        <Check size={18} strokeWidth={3} /> Redeemed · saved {usd(deal.savingsAmount)}
      </div>
      {(deal.redeemType === "code" || deal.dealUrl) && (
        <button
          onClick={reopen}
          className="flex w-full items-center justify-center gap-1.5 rounded-button border border-hairline bg-card py-2.5 text-label font-semibold text-ink transition-colors hover:bg-surface"
        >
          {deal.redeemType === "code" ? <Copy size={16} /> : <ExternalLink size={16} />}
          {reopenLabel}
        </button>
      )}
    </div>
  ) : (
    <PrimaryButton onClick={onRedeem}>
      {deal.redeemType === "code" ? <Copy size={18} /> : <ExternalLink size={18} />}
      {ctaLabel}
    </PrimaryButton>
  );

  return (
    <div className="pb-24 lg:pb-0">
      {back}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column — the offer */}
        <div>
          {/* Header block */}
          <div className="flex items-start gap-3">
            <BrandMark initials={deal.brandInitials} category={deal.category} size={56} />
            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {deal.brand}
              </p>
              <h1 className="mt-0.5 text-h1 text-ink md:text-display">{deal.title}</h1>
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

        {/* Right sidebar — grade + why + redeem (sticky on desktop) */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="space-y-4 rounded-card border border-hairline bg-card p-4 shadow-card">
            {/* Deal grade */}
            <div className="flex items-center gap-3">
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

            {/* Why this is a good deal */}
            {deal.whyForYou && (
              <div className="flex items-start gap-2 rounded-card bg-primary-tint/50 p-3.5">
                <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-label font-semibold text-primary-pressed">
                    Why this is a good deal
                  </p>
                  <p className="mt-0.5 text-caption text-ink">{deal.whyForYou}</p>
                </div>
              </div>
            )}

            {/* Redeem — desktop placement (sidebar) */}
            <div className="hidden lg:block">{redeemControl}</div>
          </div>
        </aside>
      </div>

      {/* Redeem — mobile sticky bottom CTA (clears the fixed BottomNav) */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-hairline bg-card/95 px-4 pb-3 pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-md">{redeemControl}</div>
      </div>
    </div>
  );
}
