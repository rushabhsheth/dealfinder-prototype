import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import TopBar from "../components/TopBar";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 6 — Enrollment Consent. Consent to auto-enroll in high-value
 * newsletters, with a sample list and an easy "unsubscribe anytime" promise.
 */
const SAMPLE = [
  { brand: "Delta SkyMiles", note: "Fare drops & flash sales" },
  { brand: "Patagonia", note: "Seasonal clearance alerts" },
  { brand: "Marriott Bonvoy", note: "Member-only rates" },
  { brand: "Sweetgreen", note: "Weekday lunch promos" },
];

export default function EnrollmentConsent() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex h-full flex-col bg-surface">
      <TopBar back title="Auto-enroll" />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-2">
        <p className="text-body text-ink">
          Some of the best deals only go to subscribers. With your OK, we'll join high-value
          newsletters on your behalf and pull the offers into your feed.
        </p>

        <div className="mt-5 rounded-card border border-hairline bg-card p-2 shadow-card">
          {SAMPLE.map((s, i) => (
            <div
              key={s.brand}
              className={`flex items-center gap-3 px-2.5 py-3 ${
                i < SAMPLE.length - 1 ? "border-b border-hairline" : ""
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-tint text-label font-bold text-primary-pressed">
                {s.brand.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="text-body font-semibold text-ink">{s.brand}</p>
                <p className="text-caption text-ink-muted">{s.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setEnabled((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-card border border-hairline bg-card p-4 text-left shadow-card"
        >
          <div className="pr-3">
            <p className="text-body font-semibold text-ink">Auto-enroll me</p>
            <p className="text-caption text-ink-muted">
              We'll subscribe to relevant lists. Unsubscribe anytime, one tap.
            </p>
          </div>
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-hairline"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-muted">
          <Check size={14} className="text-savings" /> You stay in control — manage every
          subscription in Settings.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        <PrimaryButton onClick={() => navigate("/scan")}>
          {enabled ? "Enroll & start scan" : "Continue without enrolling"} <ArrowRight size={18} />
        </PrimaryButton>
      </div>
    </div>
  );
}
