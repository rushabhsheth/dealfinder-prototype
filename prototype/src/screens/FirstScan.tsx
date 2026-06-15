import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanSearch, Check } from "lucide-react";
import { savings } from "../lib/data";
import { useDemo } from "../state/DemoContext";

/**
 * Screen 7 — First Scan (loading / reveal). The "magic moment": an animated
 * scan, then transition to the savings summary. Starting the scan also flips
 * the demo into the trial tier.
 */
const STEPS = [
  "Reading your inbox…",
  "Filtering promos & receipts…",
  "Matching to your interests…",
  "Ranking your best deals…",
];

export default function FirstScan() {
  const navigate = useNavigate();
  const { goPremium } = useDemo();
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const { firstScan } = savings;

  useEffect(() => {
    goPremium("trial");
  }, [goPremium]);

  useEffect(() => {
    const start = performance.now();
    const duration = 3200;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(t);
      setStep(Math.min(STEPS.length - 1, Math.floor(t * STEPS.length)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => navigate("/summary"), 450);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [navigate]);

  const scanned = Math.round(progress * firstScan.scannedMessages);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-surface px-8 text-center">
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
        {scanned.toLocaleString()} of {firstScan.scannedMessages.toLocaleString()} messages
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
    </div>
  );
}
