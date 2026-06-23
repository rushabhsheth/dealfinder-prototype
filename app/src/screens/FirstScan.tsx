import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanSearch, Check, AlertCircle } from "lucide-react";
import { savings } from "../lib/data";
import { backendEnabled, startScan, getScan } from "../lib/api";
import { useDemo } from "../state/DemoContext";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 7 — First Scan (loading / reveal). The "magic moment": an animated
 * scan, then a transition to the savings summary. Starting the scan also flips
 * the demo into the trial tier.
 *
 *  • Mock mode  — a fixed ~3.2s animation, then → /summary.
 *  • Backend mode — kicks off a REAL inbox scan and polls its progress; the bar
 *    completes only when the server says the scan is done, then hands the scan
 *    result to /summary. A failed scan shows a plain fallback (ONBOARDING §5.5).
 */
const STEPS = [
  "Reading your inbox…",
  "Filtering promos & receipts…",
  "Matching to your interests…",
  "Ranking your best deals…",
];

type Status = "scanning" | "done" | "error";

export default function FirstScan() {
  const navigate = useNavigate();
  const { goPremium, preferences } = useDemo();
  const { firstScan } = savings;

  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [scanned, setScanned] = useState(0);
  const [offersFound, setOffersFound] = useState(0);
  const [status, setStatus] = useState<Status>("scanning");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Latest scan snapshot, handed to the summary screen (kept fresh every poll so
  // the user can jump ahead before the scan fully finishes).
  const scanResult = useRef<{ foundTotal: number; offersFound: number; messagesScanned: number } | null>(null);

  // Skip the savings-summary interstitial — drop straight into the deals feed.
  const seeDealsNow = () => navigate("/feed");

  // ── Drive the scan (real or mocked) ────────────────────────────────────────
  useEffect(() => {
    if (!backendEnabled) {
      // Mock: flip to trial locally and complete after a reassuring beat.
      void goPremium("trial");
      const t = setTimeout(() => setStatus("done"), 3200);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        // Start the trial server-side FIRST — scanning is premium-gated (402
        // otherwise). Then kick off the real scan.
        await goPremium("trial");
        if (cancelled) return;
        const { scanId } = await startScan({
          categories: preferences.categories.map((c) => c.toLowerCase()),
          brands: preferences.brands,
        });
        const poll = async () => {
          if (cancelled) return;
          const { scan } = await getScan(scanId);
          setScanned(scan.messagesScanned);
          setOffersFound(scan.offersFound);
          // Keep the latest snapshot fresh so "see deals now" can jump ahead.
          scanResult.current = {
            foundTotal: scan.foundTotal,
            offersFound: scan.offersFound,
            messagesScanned: scan.messagesScanned,
          };
          if (scan.status === "done") {
            setStatus("done");
          } else if (scan.status === "error") {
            setErrorMsg(scan.error ?? "The scan couldn't finish.");
            setStatus("error");
          } else {
            timer = setTimeout(poll, 1200);
          }
        };
        await poll();
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "The scan couldn't start.");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Visual progress easing (caps below 1 until the scan actually finishes) ──
  useEffect(() => {
    if (status === "error") return;
    let raf = 0;
    const tick = () => {
      setProgress((p) => {
        const target = status === "done" ? 1 : 0.95;
        const next = p + (target - p) * 0.06;
        return next > 0.999 ? 1 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // Advance the checklist with progress.
  useEffect(() => {
    setStep(Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length)));
    if (status === "done" && progress >= 0.999) {
      // Straight into the deals feed — no savings-summary interstitial.
      const t = setTimeout(() => navigate("/feed"), 450);
      return () => clearTimeout(t);
    }
  }, [progress, status, navigate]);

  // Mock mode shows a counted denominator; backend mode just counts up.
  const displayScanned = backendEnabled
    ? scanned
    : Math.round(progress * firstScan.scannedMessages);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-urgency-tint text-accent-pressed">
          <AlertCircle size={32} />
        </span>
        <h1 className="mt-6 text-h1 text-ink">We hit a snag scanning</h1>
        <p className="mt-2 max-w-xs text-body text-ink-muted">
          {errorMsg ?? "Something interrupted the scan."} You can try again or browse deals while we
          sort it out.
        </p>
        <div className="mt-6 w-full max-w-xs space-y-2">
          <PrimaryButton onClick={() => window.location.reload()}>Try again</PrimaryButton>
          <button
            onClick={() => navigate("/feed")}
            className="w-full py-2 text-label font-semibold text-ink-muted"
          >
            Browse deals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Pulsing scanner */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/20" />
        <span
          className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/20"
          style={{ animationDelay: "0.6s" }}
        />
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white">
          <ScanSearch size={44} strokeWidth={1.75} />
        </span>
      </div>

      <h1 className="mt-8 text-h1 text-ink">Scanning your inbox</h1>
      <p className="nums mt-1.5 text-body text-ink-muted">
        {backendEnabled
          ? `${displayScanned.toLocaleString()} messages scanned`
          : `${displayScanned.toLocaleString()} of ${firstScan.scannedMessages.toLocaleString()} messages`}
      </p>

      {/* Progress bar */}
      <div className="mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-6 w-full max-w-xs space-y-2 text-left">
        {STEPS.map((s, i) => {
          const done = i < step || progress >= 1;
          const active = i === step && progress < 1;
          return (
            <div
              key={s}
              className={`flex items-center gap-2.5 text-body transition-opacity ${
                done || active ? "opacity-100" : "opacity-40"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-savings text-white" : active ? "bg-primary text-white" : "bg-hairline"
                }`}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} />
                ) : active ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                ) : null}
              </span>
              <span className={done || active ? "text-ink" : "text-ink-muted"}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* Progressive escape hatch: the scan keeps running, but the moment we've
          found deals the user can jump straight to them — never stuck waiting. */}
      {status === "scanning" && offersFound > 0 && (
        <button
          onClick={seeDealsNow}
          className="mt-7 text-label font-semibold text-primary active:opacity-70"
        >
          See your {offersFound} {offersFound === 1 ? "deal" : "deals"} now →
        </button>
      )}
    </div>
  );
}
