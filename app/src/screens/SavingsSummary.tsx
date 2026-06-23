import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { loadScanSummary, type ScanSummaryView } from "../lib/data";
import { useAsync } from "../lib/useAsync";
import { usd } from "../lib/format";
import DealCard from "../components/DealCard";
import PrimaryButton from "../components/PrimaryButton";
import ScreenState from "../components/ScreenState";

/**
 * Screen 8 — "Here's what we found you" Savings Summary.
 * The first proof of value inside the trial: big display number, count of
 * offers, top 3 highlighted, "See my feed". In backend mode the totals come
 * from the real scan result (passed via navigation state) + live offers.
 */
export default function SavingsSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const scan = (location.state as { scan?: ScanSummaryViewSource } | null)?.scan ?? null;

  const fetcher = useCallback(() => loadScanSummary(scan), [scan]);
  const { data, loading, error, reload } = useAsync<ScanSummaryView>(fetcher);

  return (
    <div>
      {loading ? (
        <ScreenState variant="loading" message="Tallying what we found…" />
      ) : error ? (
        <ScreenState variant="error" message={error} onRetry={reload} />
      ) : data ? (
        <Reveal data={data} onSeeFeed={() => navigate("/feed")} />
      ) : null}
    </div>
  );
}

interface ScanSummaryViewSource {
  foundTotal: number;
  offersFound: number;
  messagesScanned: number;
}

function Reveal({ data, onSeeFeed }: { data: ScanSummaryView; onSeeFeed: () => void }) {
  const foundNothing = data.offersFound === 0;

  return (
    <>
      {/* Lime hero — a spotlight moment */}
      <div className="rounded-card bg-gradient-to-b from-accent-tint to-surface px-6 pb-6 pt-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-badge bg-card px-3 py-1 text-label font-semibold text-savings shadow-card">
          <Sparkles size={14} /> Your first scan is done
        </span>
        {foundNothing ? (
          <>
            <p className="animate-fade-up mt-5 text-h1 text-ink">We didn't find much this time</p>
            <p className="animate-fade-up mt-2 text-body text-ink-muted">
              We scanned{" "}
              <span className="nums font-semibold text-ink">
                {data.scannedMessages.toLocaleString()}
              </span>{" "}
              messages and will keep looking — new deals show up in your feed as they land.
            </p>
          </>
        ) : (
          <>
            <p className="animate-fade-up mt-5 text-body text-ink">We found you</p>
            <p className="animate-fade-up nums text-[52px] font-bold leading-none text-savings">
              {usd(data.foundTotal)}
            </p>
            <p className="animate-fade-up mt-2 text-body text-ink-muted">
              across <span className="font-semibold text-ink">{data.offersFound} offers</span>
              {data.scannedMessages > 0 && (
                <>
                  {" "}
                  — from{" "}
                  <span className="nums font-semibold text-ink">
                    {data.scannedMessages.toLocaleString()}
                  </span>{" "}
                  messages scanned
                </>
              )}
            </p>
          </>
        )}
      </div>

      {/* Top 3 highlights */}
      <div className="pt-4">
        {data.topDeals.length > 0 && (
          <>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Top picks for you
            </p>
            <div className="space-y-3">
              {data.topDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} compact />
              ))}
            </div>
          </>
        )}

        <p className="mt-5 text-center text-caption text-ink-muted">
          We'll keep scanning and only ping you when something's worth it.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-6">
        <PrimaryButton onClick={onSeeFeed}>
          See my feed <ArrowRight size={18} />
        </PrimaryButton>
      </div>
    </>
  );
}
