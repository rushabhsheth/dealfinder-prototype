import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, X, RotateCcw, Smartphone } from "lucide-react";
import { useDemo } from "../state/DemoContext";
import type { Tier } from "../types";

/**
 * Demo control — a hidden menu to jump to any screen and switch entitlement
 * tier, so live demos are painless (BUILD_PLAN.md Phase 5). Not part of the
 * product; just a presenter aid floating over the phone frame.
 */
const JUMPS: { label: string; to: string }[] = [
  { label: "0 · Landing (signed-out)", to: "/" },
  { label: "1 · Value Explainer", to: "/intro" },
  { label: "2 · Free Feed", to: "/free" },
  { label: "3 · Meet Agent", to: "/trial" },
  { label: "5 · Connect Email", to: "/connect" },
  { label: "6 · Enrollment Consent", to: "/enroll" },
  { label: "7 · First Scan", to: "/scan" },
  { label: "8 · Savings Summary", to: "/summary" },
  { label: "9 · Ranked Feed ⭐", to: "/feed" },
  { label: "10 · Deal Detail ⭐", to: "/deal/dl-001" },
  { label: "11 · Travel Watch", to: "/watches" },
  { label: "12 · Savings Dashboard", to: "/savings" },
  { label: "13 · Paywall ⭐", to: "/paywall" },
  { label: "14 · Enrolled Brands", to: "/brands" },
  { label: "15 · Settings", to: "/settings" },
  { label: "16 · Privacy", to: "/privacy" },
];

const TIERS: Tier[] = ["free", "trial", "paid"];

export default function DemoMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tier, setTier, signedIn, setSignedIn, reset } = useDemo();

  // Phone-preview toggle. Operates on the top window so it works both from the
  // normal app (enter preview) and from inside the iframe (exit preview).
  const topWin = window.top ?? window;
  let inPhone = false;
  try {
    inPhone = new URLSearchParams(topWin.location.search).get("frame") === "phone";
  } catch {
    /* cross-origin (shouldn't happen, same origin) — leave false */
  }
  const togglePhone = () => {
    try {
      const u = new URL(topWin.location.href);
      if (inPhone) u.searchParams.delete("frame");
      else u.searchParams.set("frame", "phone");
      topWin.location.href = u.toString();
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        aria-label="Demo menu"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-ink/85 text-white shadow-xl backdrop-blur active:scale-95 md:bottom-4"
      >
        {open ? <X size={18} /> : <Wand2 size={18} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] flex flex-col items-center justify-end bg-ink/40 p-4 backdrop-blur-sm">
          <div className="max-h-[80%] w-full max-w-md overflow-hidden rounded-card bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-h2 text-ink">Demo controls</span>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-label font-semibold text-primary"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <div className="px-4 pt-3">
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                Auth state
              </p>
              <div className="flex gap-2">
                {[
                  { label: "Signed out", value: false },
                  { label: "Signed in", value: true },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setSignedIn(s.value)}
                    className={`flex-1 rounded-button border py-2 text-label font-semibold ${
                      signedIn === s.value
                        ? "border-primary bg-primary text-white"
                        : "border-hairline bg-card text-ink-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-3">
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                Entitlement tier
              </p>
              <div className="flex gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`flex-1 rounded-button border py-2 text-label font-semibold capitalize ${
                      tier === t
                        ? "border-primary bg-primary text-white"
                        : "border-hairline bg-card text-ink-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-3">
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                View
              </p>
              <button
                onClick={togglePhone}
                className={`flex w-full items-center justify-center gap-2 rounded-button border py-2 text-label font-semibold ${
                  inPhone
                    ? "border-primary bg-primary text-white"
                    : "border-hairline bg-card text-ink"
                }`}
              >
                <Smartphone size={16} />
                {inPhone ? "Exit phone preview" : "Phone preview"}
              </button>
            </div>

            <div className="no-scrollbar max-h-72 overflow-y-auto px-4 pb-4">
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                Jump to screen
              </p>
              <div className="grid grid-cols-2 gap-2">
                {JUMPS.map((j) => (
                  <button
                    key={j.to + j.label}
                    onClick={() => {
                      navigate(j.to);
                      setOpen(false);
                    }}
                    className="rounded-button border border-hairline bg-surface px-3 py-2 text-left text-caption font-semibold text-ink active:bg-primary-tint"
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
