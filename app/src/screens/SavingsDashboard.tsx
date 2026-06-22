import { useNavigate } from "react-router-dom";
import { TrendingUp, Receipt, Percent, type LucideIcon } from "lucide-react";
import { savings, CATEGORY_LABELS } from "../lib/data";
import { usd, shortDate } from "../lib/format";
import BottomNav from "../components/BottomNav";
import TopAppBar from "../components/TopAppBar";

/**
 * Screen 12 — Savings Dashboard. Cumulative savings (the retention hook):
 * total saved, savings over time, redeemed count, by-category breakdown.
 */
export default function SavingsDashboard() {
  const navigate = useNavigate();
  const { cumulative } = savings;
  const maxCat = Math.max(...cumulative.byCategory.map((c) => c.saved));

  return (
    <div className="flex h-full flex-col">
      <TopAppBar title="Your savings" />

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {/* Hero total */}
        <div className="rounded-card border border-hairline bg-card p-5 text-center shadow-card">
          <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Saved with DealFinder
          </p>
          <p className="nums mt-1 text-[44px] font-bold leading-none text-savings">
            {usd(cumulative.totalSaved)}
          </p>
          <Sparkline />
        </div>

        {/* Stat cards */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat
            Icon={Receipt}
            label="Deals redeemed"
            value={String(cumulative.dealsRedeemed)}
          />
          <Stat
            Icon={Percent}
            label="Avg. saving"
            value={`${cumulative.averageSavingPercent}%`}
          />
        </div>

        {/* By category */}
        <div className="mt-4 rounded-card border border-hairline bg-card p-4 shadow-card">
          <p className="mb-3 flex items-center gap-1.5 text-label font-semibold uppercase tracking-wide text-ink-muted">
            <TrendingUp size={14} /> By category
          </p>
          <div className="space-y-3">
            {cumulative.byCategory.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-caption">
                  <span className="font-semibold text-ink">{CATEGORY_LABELS[c.category]}</span>
                  <span className="nums text-savings">{usd(c.saved)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-savings"
                    style={{ width: `${Math.round((c.saved / maxCat) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent redemptions */}
        <div className="mt-4 rounded-card border border-hairline bg-card p-2 shadow-card">
          <p className="px-2.5 pb-1 pt-2 text-label font-semibold uppercase tracking-wide text-ink-muted">
            Recently redeemed
          </p>
          {savings.redeemed
            .slice()
            .reverse()
            .map((r, i, arr) => (
              <button
                key={r.dealId}
                onClick={() => navigate(`/deal/${r.dealId}`)}
                className={`flex w-full items-center justify-between px-2.5 py-3 text-left ${
                  i < arr.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <div>
                  <p className="text-body font-semibold text-ink">{r.brand}</p>
                  <p className="text-caption text-ink-muted">{shortDate(r.redeemedAt)}</p>
                </div>
                <span className="nums text-h2 text-savings">{usd(r.saved)}</span>
              </button>
            ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-hairline bg-card p-4 shadow-card">
      <Icon size={18} />
      <p className="nums mt-2 text-h1 text-ink">{value}</p>
      <p className="text-caption text-ink-muted">{label}</p>
    </div>
  );
}

/** Simple cumulative-savings area chart from the mock timeline. */
function Sparkline() {
  const { timeline } = savings.cumulative;
  const w = 280;
  const h = 64;
  const max = Math.max(...timeline.map((p) => p.saved)) || 1;
  const pts = timeline.map((p, i) => {
    const x = (i / (timeline.length - 1)) * w;
    const y = h - (p.saved / max) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points={area} fill="var(--savings-50)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--savings-600)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5} fill="var(--savings-600)" />
      ))}
    </svg>
  );
}
