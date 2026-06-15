import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useDemo } from "../state/DemoContext";

/**
 * HeaderMenu — the top-right hamburger on the main tab screens. Opens a
 * right-side slide-over with the plan status and Settings & Privacy (which
 * moved out of the bottom nav).
 */
export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tier } = useDemo();

  const planLabel =
    tier === "paid" ? "Premium · annual" : tier === "trial" ? "Free trial" : "Free";

  return (
    <>
      <button
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-black/5"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="absolute inset-0 z-40 flex justify-start">
          {/* Scrim */}
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />

          {/* Panel — slides in from the left (hamburger lives top-left) */}
          <div className="animate-slide-in-left relative z-10 flex h-full w-72 max-w-[82%] flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-4">
              <span className="text-h2 text-ink">Menu</span>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted active:bg-black/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Plan status */}
            <div className="px-4 pt-4">
              <div className="flex items-center gap-2.5 rounded-card bg-primary-tint/50 px-3.5 py-3">
                <Sparkles size={18} className="shrink-0 text-primary" />
                <div>
                  <p className="text-caption text-ink-muted">Your plan</p>
                  <p className="text-label font-semibold text-ink">{planLabel}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <nav className="mt-2 px-2">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-3 rounded-button px-3 py-3.5 text-left active:bg-surface"
              >
                <SettingsIcon size={20} className="text-ink-muted" />
                <span className="flex-1 text-body font-semibold text-ink">
                  Settings &amp; Privacy
                </span>
                <ChevronRight size={18} className="text-ink-muted" />
              </button>
            </nav>

            <p className="mt-auto flex items-center gap-1.5 px-4 pb-8 text-caption text-ink-muted">
              <ShieldCheck size={14} className="shrink-0 text-primary" /> Read-only access ·
              payout-blind ranking
            </p>
          </div>
        </div>
      )}
    </>
  );
}
