import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ShieldCheck, Lock, ArrowRight, PauseCircle, Mail, EyeOff, ChevronDown, Check } from "lucide-react";
import { publicDeals, CATEGORY_LABELS, savings, loadPersonalizedDeals } from "../lib/data";
import { useAsync } from "../lib/useAsync";
import { usd, expiryLabel, isUrgent } from "../lib/format";
import { gradeForDeal, type GradeLetter } from "../lib/grade";
import { useDemo } from "../state/DemoContext";
import type { Deal } from "../types";
import DealCard from "../components/DealCard";
import DealGrade from "../components/DealGrade";
import SavingsBadge from "../components/SavingsBadge";
import CategoryChips from "../components/CategoryChips";
import ScreenHeader from "../components/ScreenHeader";
import UpsellNudge from "../components/UpsellNudge";
import ScreenState from "../components/ScreenState";
import BrandMark from "../components/BrandMark";
import InterestControls from "../components/InterestControls";
import UrgencyBadge from "../components/UrgencyBadge";

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
  const { tier, downgraded, nudgeDismissed } = useDemo();
  const isPremium = tier === "trial" || tier === "paid";

  const [view, setView] = useState<View>(isPremium ? "foryou" : "all");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(publicDeals.map((d) => CATEGORY_LABELS[d.category])))],
    []
  );
  const visiblePublic = publicDeals.filter(
    (d) => category === "All" || CATEGORY_LABELS[d.category] === category
  );

  // Connect-inbox nudge: free users, on app open, until dismissed for the session.
  const showNudge = !isPremium && !nudgeDismissed;

  return (
    <div>
      <ScreenHeader title="Deals">
        <div className="flex max-w-md rounded-button bg-hairline/50 p-1">
          <Segment label="For You" active={view === "foryou"} onClick={() => setView("foryou")} />
          <Segment label="All Deals" active={view === "all"} onClick={() => setView("all")} />
        </div>
      </ScreenHeader>

      {showNudge && <UpsellNudge />}

      {view === "foryou" ? (
        isPremium ? (
          <ForYou tier={tier} navigate={navigate} />
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
const GRADE_ORDER: GradeLetter[] = ["S", "A", "B", "C", "D"];
const CATEGORY_ORDER = ["Travel", "Retail", "Dining", "Tech"];

interface RankedDeal {
  deal: Deal;
  letter: GradeLetter;
  interest: ReturnType<ReturnType<typeof useDemo>["getInterest"]>;
}

function ForYou({ tier, navigate }: { tier: string; navigate: (to: string) => void }) {
  const { data: deals, loading, error, reload } = useAsync<Deal[]>(loadPersonalizedDeals);
  const { getInterest } = useDemo();
  // Filter dimensions: interest (the user's own signal) + category (single-select
  // label) + tier (multi-select grade letters). "All" / empty = no filter.
  const [interestFilter, setInterestFilter] = useState<"all" | "interested" | "maybe">("all");
  const [category, setCategory] = useState("All");
  const [grades, setGrades] = useState<Set<GradeLetter>>(new Set());
  // Brands showing all their offers (vs. the default top 3).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  // Which filter dropdown is open (one at a time).
  const [openMenu, setOpenMenu] = useState<"interest" | "category" | "tier" | null>(null);

  if (loading) return <ScreenState variant="loading" message="Loading your deals…" />;
  if (error) return <ScreenState variant="error" message={error} onRetry={reload} />;
  if (!deals || deals.length === 0) {
    return (
      <ScreenState
        variant="empty"
        title="No personalized deals yet"
        message="Your scan didn't find personalized deals this time — we'll keep looking and surface them here."
      />
    );
  }

  // Annotate each offer with its payout-blind grade + the user's interest signal,
  // preserving the incoming ranked order (highest relevance first).
  const ranked: RankedDeal[] = deals.map((deal) => ({
    deal,
    letter: gradeForDeal(deal).letter,
    interest: getInterest(deal.id),
  }));

  const gradesPresent = GRADE_ORDER.filter((g) => ranked.some((r) => r.letter === g));
  const categoriesPresent = CATEGORY_ORDER.filter((c) =>
    ranked.some((r) => CATEGORY_LABELS[r.deal.category] === c)
  );
  const interestedCount = ranked.filter((r) => r.interest === "interested").length;
  const maybeCount = ranked.filter((r) => r.interest === "maybe").length;

  const filtered = ranked.filter(
    (r) =>
      (interestFilter === "all" || r.interest === interestFilter) &&
      (category === "All" || CATEGORY_LABELS[r.deal.category] === category) &&
      (grades.size === 0 || grades.has(r.letter))
  );
  const hiddenCount = filtered.filter((r) => r.interest === "not").length;
  const shown = showHidden ? filtered : filtered.filter((r) => r.interest !== "not");

  // Group by brand. Both the brand order and the within-brand order follow the
  // ranked sequence, so the best brands and best offers still float to the top.
  const groups: { brand: string; items: RankedDeal[] }[] = [];
  const groupIndex = new Map<string, number>();
  for (const r of shown) {
    let i = groupIndex.get(r.deal.brand);
    if (i === undefined) {
      i = groups.length;
      groupIndex.set(r.deal.brand, i);
      groups.push({ brand: r.deal.brand, items: [] });
    }
    groups[i].items.push(r);
  }

  const totalSavings = shown.reduce((sum, r) => sum + r.deal.savingsAmount, 0);

  const toggleGrade = (g: GradeLetter) =>
    setGrades((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  const toggleExpand = (brand: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });

  return (
    <>
      <p className="pb-2 text-caption text-ink-muted">
        <span className="nums font-semibold text-savings">{usd(totalSavings)}</span> in offers
        ranked for you · {shown.length} live · {groups.length} brand
        {groups.length === 1 ? "" : "s"}
      </p>

      {/* Three filter dimensions on one row, each a dropdown. Interest +
          Category are single-select; Tier (the grade on each card) is multi. */}
      <div className="relative z-20 mb-3 flex items-center gap-2 border-b border-hairline pb-3">
        <FilterMenu
          label="Interest"
          pillText={
            interestFilter === "all"
              ? "Interest"
              : interestFilter === "interested"
                ? "Interested"
                : "Maybe"
          }
          active={interestFilter !== "all"}
          open={openMenu === "interest"}
          onOpen={() => setOpenMenu("interest")}
          onClose={() => setOpenMenu(null)}
        >
          <MenuOption
            label="All"
            selected={interestFilter === "all"}
            onClick={() => {
              setInterestFilter("all");
              setOpenMenu(null);
            }}
          />
          <MenuOption
            label="Interested"
            count={interestedCount}
            selected={interestFilter === "interested"}
            onClick={() => {
              setInterestFilter("interested");
              setOpenMenu(null);
            }}
          />
          <MenuOption
            label="Maybe"
            count={maybeCount}
            selected={interestFilter === "maybe"}
            onClick={() => {
              setInterestFilter("maybe");
              setOpenMenu(null);
            }}
          />
        </FilterMenu>

        <FilterMenu
          label="Category"
          pillText={category === "All" ? "Category" : category}
          active={category !== "All"}
          open={openMenu === "category"}
          onOpen={() => setOpenMenu("category")}
          onClose={() => setOpenMenu(null)}
        >
          <MenuOption
            label="All"
            selected={category === "All"}
            onClick={() => {
              setCategory("All");
              setOpenMenu(null);
            }}
          />
          {categoriesPresent.map((c) => (
            <MenuOption
              key={c}
              label={c}
              selected={category === c}
              onClick={() => {
                setCategory(c);
                setOpenMenu(null);
              }}
            />
          ))}
        </FilterMenu>

        <FilterMenu
          label="Tier"
          pillText={
            grades.size === 0
              ? "Tier"
              : grades.size <= 3
                ? GRADE_ORDER.filter((g) => grades.has(g)).join(", ")
                : `${grades.size} tiers`
          }
          active={grades.size > 0}
          open={openMenu === "tier"}
          onOpen={() => setOpenMenu("tier")}
          onClose={() => setOpenMenu(null)}
        >
          <MenuOption
            label="All tiers"
            selected={grades.size === 0}
            onClick={() => {
              setGrades(new Set());
              setOpenMenu(null);
            }}
          />
          {gradesPresent.map((g) => (
            <MenuOption
              key={g}
              label={g}
              selected={grades.has(g)}
              onClick={() => toggleGrade(g)}
            />
          ))}
        </FilterMenu>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-card border border-hairline bg-card px-4 py-6 text-center text-caption text-ink-muted">
          No offers match these filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(({ brand, items }, gi) => {
            const brandSavings = items.reduce((s, r) => s + r.deal.savingsAmount, 0);
            const lead = items[0].deal;
            const isExpanded = expanded.has(brand);
            const visibleOffers = isExpanded ? items : items.slice(0, 3);
            // Gate on the total count, not what's hidden right now — otherwise the
            // toggle disappears once expanded and there's no way to collapse.
            const overflow = items.length - 3;
            return (
              <section
                key={brand}
                className="animate-fade-up rounded-card border border-hairline bg-card p-3 shadow-card"
                style={{ animationDelay: `${gi * 40}ms` }}
              >
                {/* Brand header — Enrolled Brands style */}
                <div className="flex items-center gap-3">
                  <BrandMark initials={lead.brandInitials} category={lead.category} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-ink">{brand}</p>
                    <p className="mt-0.5 text-caption text-ink-muted">
                      {items.length} offer{items.length === 1 ? "" : "s"} ·{" "}
                      <span className="nums font-semibold text-savings">{usd(brandSavings)}</span> to
                      save
                    </p>
                  </div>
                </div>

                {/* Top offers, shown inline on the card */}
                <div className="mt-3 space-y-2">
                  {visibleOffers.map(({ deal, interest }) => (
                    <OfferRow
                      key={deal.id}
                      deal={deal}
                      dimmed={interest === "not"}
                      onOpen={() => navigate(`/deal/${deal.id}`)}
                    />
                  ))}
                </div>

                {overflow > 0 && (
                  <button
                    onClick={() => toggleExpand(brand)}
                    className="mt-2 w-full rounded-button py-1.5 text-caption font-semibold text-primary"
                  >
                    {isExpanded ? "Show fewer" : `Show ${overflow} more offer${overflow === 1 ? "" : "s"}`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowHidden((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-button border border-hairline bg-card py-2 text-caption font-semibold text-ink-muted"
        >
          <EyeOff size={14} />
          {showHidden ? "Hide" : "Show"} {hiddenCount} not-for-me offer
          {hiddenCount === 1 ? "" : "s"}
        </button>
      )}

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

/**
 * OfferRow — one offer shown inline on a brand card (Enrolled Brands style).
 * The text taps through to the deal; the grade stamp + a compact interest
 * control sit on the right, so you can mark interest without leaving the feed.
 */
function OfferRow({
  deal,
  dimmed,
  onOpen,
}: {
  deal: Deal;
  dimmed: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-button border border-hairline bg-surface px-3 py-2.5 transition ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <button onClick={onOpen} className="min-w-0 flex-1 text-left active:opacity-70">
        <p className="truncate text-body font-semibold text-ink">{deal.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SavingsBadge amount={deal.savingsAmount} percent={deal.savingsPercent} size="sm" />
          {isUrgent(deal.expiresAt) ? (
            <UrgencyBadge expiresAt={deal.expiresAt} />
          ) : (
            <span className="text-caption text-ink-muted">{expiryLabel(deal.expiresAt)}</span>
          )}
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <DealGrade deal={deal} />
        <InterestControls dealId={deal.id} compact />
      </div>
    </div>
  );
}

/**
 * FilterMenu — a dropdown pill for one filter dimension. The pill shows the
 * current selection (or the dimension name when unset) and toggles a popover of
 * options below it. Active (non-default) pills go teal. A full-screen backdrop
 * closes the menu on outside taps.
 */
function FilterMenu({
  label,
  pillText,
  active,
  open,
  onOpen,
  onClose,
  children,
}: {
  label: string;
  pillText: string;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={open ? onClose : onOpen}
        aria-expanded={open}
        className={`flex max-w-[140px] items-center gap-1 rounded-badge border px-3 py-1.5 text-label font-semibold transition-colors ${
          active ? "border-primary bg-primary text-white" : "border-hairline bg-card text-ink-muted"
        }`}
      >
        <span className="truncate">{pillText}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button aria-label="Close" onClick={onClose} className="fixed inset-0 z-30" />
          <div className="absolute left-0 top-full z-40 mt-1.5 min-w-[150px] rounded-card border border-hairline bg-card p-1 shadow-card">
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {label}
            </p>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

/** One option row inside a FilterMenu dropdown. */
function MenuOption({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-label text-ink transition-colors active:bg-hairline/30"
    >
      <span className="flex-1">
        {label}
        {count != null && count > 0 && <span className="text-ink-muted"> · {count}</span>}
      </span>
      {selected && <Check size={16} className="shrink-0 text-primary" />}
    </button>
  );
}

/* ---- For You (free): connect-inbox upsell ---- */
function ForYouLocked({ onStartTrial }: { onStartTrial: () => void }) {
  return (
    <div className="flex flex-col items-center px-2 pt-8 text-center">
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
        <div className="mb-3 rounded-card border border-hairline bg-card p-4 shadow-card">
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

      <p className="mb-2 inline-flex items-center gap-1 text-caption text-ink-muted">
        <Lock size={12} /> Public deals · same for everyone
      </p>

      <div className="mb-3">
        <CategoryChips categories={categories} active={category} onChange={onCategory} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </>
  );
}
