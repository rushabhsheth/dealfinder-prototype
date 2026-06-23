import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronRight,
  ShieldCheck,
  Lock,
  PauseCircle,
  PlayCircle,
  MailX,
} from "lucide-react";
import type { BrandStatus, Deal, EnrolledBrand } from "../types";
import { loadEnrolledBrands, loadDeal, CATEGORY_LABELS } from "../lib/data";
import { backendEnabled, pauseBrand, unsubscribeBrand, reenrollBrand } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { usd, shortDate } from "../lib/format";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import ScreenHeader from "../components/ScreenHeader";
import BrandMark from "../components/BrandMark";
import PrimaryButton from "../components/PrimaryButton";
import ScreenState from "../components/ScreenState";

type Filter = "all" | "enrolled" | "detected" | "paused";
type Sort = "value" | "recent" | "emails" | "az";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "enrolled", label: "Enrolled" },
  { key: "detected", label: "Detected" },
  { key: "paused", label: "Paused" },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: "value", label: "Value" },
  { key: "recent", label: "Recently added" },
  { key: "emails", label: "Most emails" },
  { key: "az", label: "A–Z" },
];

/**
 * Enrolled Brands — the trust/control ledger of every brand sending the user
 * deals via DealFinder (ENROLLED_BRANDS_PRD.md). Premium-gated; pause /
 * unsubscribe / re-enroll mutate per-brand overrides on DemoContext.
 */
export default function EnrolledBrands() {
  const { tier, downgraded, brandStatus, setBrandStatus } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("value");
  const [openId, setOpenId] = useState<string | null>(null);

  const isPremium = tier === "trial" || tier === "paid";

  const {
    data: brands,
    loading,
    error,
    reload,
  } = useAsync<EnrolledBrand[]>(
    () => (isPremium ? loadEnrolledBrands() : Promise.resolve([])),
    [isPremium],
  );
  const allBrands = brands ?? [];

  // Effective status = user's override (if any) over the brand's baseline.
  const statusOf = (b: EnrolledBrand): BrandStatus => brandStatus[b.id] ?? b.status;

  const summary = useMemo(() => {
    const count = allBrands.length;
    const deals = allBrands.reduce((n, b) => n + b.dealsSurfaced, 0);
    const saved = allBrands.reduce((n, b) => n + b.totalSaved, 0);
    return { brands: count, deals, saved };
  }, [allBrands]);

  const rows = useMemo(() => {
    const filtered = allBrands.filter((b) => {
      if (filter === "enrolled") return b.source === "enrolled";
      if (filter === "detected") return b.source === "detected";
      if (filter === "paused") return statusOf(b) === "paused";
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "value") return b.totalSaved - a.totalSaved;
      if (sort === "recent") return b.enrolledAt < a.enrolledAt ? -1 : 1;
      if (sort === "emails") return b.emailsPerMonth - a.emailsPerMonth;
      return a.brand.localeCompare(b.brand);
    });
    return sorted;
    // statusOf reads brandStatus, so depend on it for the "paused" filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sort, brandStatus, allBrands]);

  const openBrand = allBrands.find((b) => b.id === openId) ?? null;

  if (!isPremium) return <LockedState downgraded={downgraded} />;

  if (loading) {
    return (
      <div>
        <ScreenHeader title="Enrolled brands" />
        <ScreenState variant="loading" message="Loading your brands…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ScreenHeader title="Enrolled brands" />
        <ScreenState variant="error" message={error} onRetry={reload} />
      </div>
    );
  }

  if (allBrands.length === 0) {
    return (
      <div>
        <ScreenHeader title="Enrolled brands" />
        <ScreenState
          variant="empty"
          title="No brands yet"
          message="Once your inbox scan finishes, the brands sending you deals show up here."
        />
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Enrolled brands" />

      <div>
        {/* Summary strip */}
        <div className="flex items-stretch rounded-card border border-hairline bg-card px-2 py-3 shadow-card">
          <Stat value={String(summary.brands)} label="brands" />
          <Divider />
          <Stat value={String(summary.deals)} label="deals delivered" />
          <Divider />
          <Stat value={usd(summary.saved)} label="saved" />
        </div>

        {/* Filters */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-badge border px-3 py-1.5 text-label font-semibold transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary-tint text-primary-pressed"
                  : "border-hairline bg-card text-ink-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-caption text-ink-muted">Sort</span>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`shrink-0 rounded-badge px-2.5 py-1 text-caption font-semibold ${
                  sort === s.key ? "bg-ink text-white" : "text-ink-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {rows.length === 0 ? (
          <p className="mt-3 px-1 py-8 text-center text-caption text-ink-muted">
            No brands match this filter.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b) => (
              <BrandRow key={b.id} brand={b} status={statusOf(b)} onOpen={() => setOpenId(b.id)} />
            ))}
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-1.5 px-6 text-center text-caption text-ink-muted">
          <ShieldCheck size={14} className="text-primary" /> We never rank by payout. You control
          what reaches you.
        </p>
      </div>

      {openBrand && (
        <BrandSheet
          brand={openBrand}
          status={statusOf(openBrand)}
          onClose={() => setOpenId(null)}
          onSetStatus={setBrandStatus}
          onChanged={reload}
        />
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center px-1 text-center">
      <span className="nums text-h1 text-ink">{value}</span>
      <span className="text-caption text-ink-muted">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="w-px self-stretch bg-hairline" />;
}

function SourceBadge({ source }: { source: EnrolledBrand["source"] }) {
  return source === "enrolled" ? (
    <span className="rounded-badge bg-primary-tint px-1.5 py-0.5 text-[11px] font-semibold text-primary-pressed">
      Enrolled
    </span>
  ) : (
    <span className="rounded-badge bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
      Detected
    </span>
  );
}

function StatusBadge({ status }: { status: BrandStatus }) {
  if (status === "active")
    return (
      <span className="rounded-badge bg-savings-tint px-1.5 py-0.5 text-[11px] font-semibold text-savings">
        Active
      </span>
    );
  if (status === "paused")
    return (
      <span className="rounded-badge bg-urgency-tint px-1.5 py-0.5 text-[11px] font-semibold text-accent-pressed">
        Paused
      </span>
    );
  return (
    <span className="rounded-badge border border-hairline px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
      Unsubscribed
    </span>
  );
}

function BrandRow({
  brand,
  status,
  onOpen,
}: {
  brand: EnrolledBrand;
  status: BrandStatus;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-card border border-hairline bg-card p-3.5 text-left shadow-card transition active:scale-[0.99]"
    >
      <BrandMark initials={brand.brandInitials} category={brand.category} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-body font-semibold text-ink">{brand.brand}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SourceBadge source={brand.source} />
          <StatusBadge status={status} />
          <span className="text-[11px] text-ink-muted">{CATEGORY_LABELS[brand.category]}</span>
        </div>
        <p className="mt-1.5 text-caption text-ink-muted">
          {brand.dealsSurfaced} deals
          {brand.totalSaved > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-savings">{usd(brand.totalSaved)} saved</span>
            </>
          )}
          {brand.lastOfferAt && <> · {shortDate(brand.lastOfferAt)}</>}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-ink-muted" />
    </button>
  );
}

function BrandSheet({
  brand,
  status,
  onClose,
  onSetStatus,
  onChanged,
}: {
  brand: EnrolledBrand;
  status: BrandStatus;
  onClose: () => void;
  onSetStatus: (id: string, status: BrandStatus) => void;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmingUnsub, setConfirmingUnsub] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: fetchedOffers } = useAsync<Deal[]>(
    () =>
      Promise.all(brand.offerDealIds.map((id) => loadDeal(id))).then((ds) =>
        ds.filter((d): d is Deal => Boolean(d)),
      ),
    [brand.id],
  );
  const offers = fetchedOffers ?? [];

  // Backend mode: hit the real endpoint, reconcile via reload, close on success.
  // Mock mode: flip the local override (DemoContext), keep the sheet open.
  const runControl = async (
    next: BrandStatus,
    label: string,
    call: () => Promise<unknown>,
  ) => {
    if (busy) return;
    if (!backendEnabled) {
      onSetStatus(brand.id, next);
      toast.show(label);
      return;
    }
    setBusy(true);
    try {
      await call();
      onChanged();
      toast.show(label);
      onClose();
    } catch {
      toast.show("Couldn't update — please try again");
    } finally {
      setBusy(false);
    }
  };

  const pause = () =>
    runControl("paused", `Paused ${brand.brand}`, () => pauseBrand(brand.id));
  const reEnroll = () =>
    runControl("active", `Re-enrolled ${brand.brand}`, () => reenrollBrand(brand.id));
  const unsubscribe = async () => {
    setConfirmingUnsub(false);
    if (busy) return;
    if (!backendEnabled) {
      onSetStatus(brand.id, "unsubscribed");
      toast.show(`Unsubscribed from ${brand.brand}`);
      return;
    }
    setBusy(true);
    try {
      const r = await unsubscribeBrand(brand.id);
      onChanged();
      toast.show(r.sent ? `Unsubscribed from ${brand.brand}` : `Marked ${brand.brand} unsubscribed`);
      onClose();
    } catch {
      toast.show("Couldn't unsubscribe — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div className="animate-fade-up relative z-10 max-h-[88%] w-full overflow-y-auto rounded-t-card bg-card pb-7 shadow-2xl sm:max-w-lg sm:rounded-card">
        {/* Header */}
        <div className="sticky top-0 flex items-center gap-3 border-b border-hairline bg-card px-4 py-3.5">
          <BrandMark initials={brand.brandInitials} category={brand.category} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-h2 text-ink">{brand.brand}</p>
            <p className="truncate text-caption text-ink-muted">{brand.senderDomain}</p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted active:bg-black/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <SourceBadge source={brand.source} />
            <StatusBadge status={status} />
          </div>

          {/* Why / when */}
          <p className="mt-3 text-body text-ink">
            {brand.source === "enrolled" ? (
              <>
                We enrolled you on {shortDate(brand.enrolledAt)}
                {brand.enrolledReason ? ` · ${brand.enrolledReason}.` : "."}
              </>
            ) : (
              <>Detected in your inbox on {shortDate(brand.enrolledAt)} — you were already subscribed.</>
            )}
          </p>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <SheetStat value={String(brand.dealsSurfaced)} label="deals" />
            <SheetStat value={usd(brand.totalSaved)} label="saved" />
            <SheetStat value={`${brand.emailsPerMonth}/mo`} label="emails" />
          </div>

          {/* Recent offers */}
          {offers.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-label font-semibold text-ink">Recent offers</p>
              <div className="space-y-2">
                {offers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/deal/${d.id}`)}
                    className="flex w-full items-center gap-2 rounded-button border border-hairline bg-surface px-3 py-2.5 text-left active:scale-[0.99]"
                  >
                    <span className="min-w-0 flex-1 truncate text-body text-ink">{d.title}</span>
                    {d.savingsAmount > 0 && (
                      <span className="nums shrink-0 text-label font-semibold text-savings">
                        {usd(d.savingsAmount)}
                      </span>
                    )}
                    <ChevronRight size={16} className="shrink-0 text-ink-muted" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions — no dark patterns */}
          <div className="mt-5 space-y-2">
            {status === "active" && (
              <ActionButton Icon={PauseCircle} label="Pause — stop surfacing deals" onClick={pause} />
            )}
            {(status === "paused" || status === "unsubscribed") && (
              <PrimaryButton onClick={reEnroll}>
                <PlayCircle size={18} /> Re-enroll
              </PrimaryButton>
            )}
            {status !== "unsubscribed" &&
              (confirmingUnsub ? (
                <div className="rounded-button border border-hairline bg-surface p-3">
                  <p className="text-caption text-ink">
                    Unsubscribe from {brand.brand}? We'll send a real unsubscribe and stop pulling
                    their offers.
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => setConfirmingUnsub(false)}
                      className="flex-1 rounded-button border border-hairline bg-card py-2.5 text-label font-semibold text-ink-muted"
                    >
                      Keep
                    </button>
                    <button
                      onClick={unsubscribe}
                      className="flex-1 rounded-button bg-accent py-2.5 text-label font-semibold text-white"
                    >
                      Unsubscribe
                    </button>
                  </div>
                </div>
              ) : (
                <ActionButton
                  Icon={MailX}
                  label={
                    brand.canOneClickUnsubscribe ? "Unsubscribe" : "Unsubscribe (via provider)"
                  }
                  onClick={() => setConfirmingUnsub(true)}
                  danger
                />
              ))}
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-caption text-ink-muted">
            <ShieldCheck size={14} className="text-primary" /> Read-only. Unsubscribe is one tap,
            always.
          </p>
        </div>
      </div>
    </div>
  );
}

function SheetStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-button border border-hairline bg-surface py-2.5">
      <span className="nums text-h2 text-ink">{value}</span>
      <span className="text-caption text-ink-muted">{label}</span>
    </div>
  );
}

function ActionButton({
  Icon,
  label,
  onClick,
  danger = false,
}: {
  Icon: typeof PauseCircle;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-button border py-3 text-label font-semibold ${
        danger
          ? "border-hairline bg-card text-accent-pressed"
          : "border-hairline bg-card text-ink"
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

function LockedState({ downgraded }: { downgraded: boolean }) {
  const navigate = useNavigate();
  return (
    <div>
      <ScreenHeader title="Enrolled brands" />
      <div className="mx-auto flex max-w-sm flex-col items-center px-2 pt-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint">
          <Lock size={26} className="text-primary" />
        </span>
        <h2 className="mt-4 text-h1 text-ink">A premium feature</h2>
        <p className="mt-2 text-body text-ink-muted">
          Enrolled Brands shows every brand sending you deals — and lets you pause or unsubscribe
          in one tap. {downgraded ? "Resubscribe to manage them again." : "Start your trial to see yours."}
        </p>
        <div className="mt-6 w-full">
          <PrimaryButton onClick={() => navigate(downgraded ? "/paywall" : "/trial")}>
            {downgraded ? "Resubscribe" : "Start free trial"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
