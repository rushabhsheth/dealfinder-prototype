import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  Store,
  ChevronRight,
  Sparkles,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useDemo } from "../state/DemoContext";
import { useToast } from "./Toast";
import { signOut as apiSignOut } from "../lib/api";

/**
 * HeaderMenu — the top-left hamburger on the main tab screens. Opens a
 * slide-over with plan status and the periodic trust/control surfaces:
 * Enrolled Brands, Settings, and Privacy (kept separate so the "delete my
 * data" intent isn't mixed in with settings).
 */
export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tier, reset } = useDemo();
  const toast = useToast();

  const planLabel =
    tier === "paid" ? "Premium · annual" : tier === "trial" ? "Free trial" : "Free";

  // Clears the real Supabase session (no-op in demo mode) plus demo state, then
  // returns to the front-door screen.
  const signOut = () => {
    setOpen(false);
    void apiSignOut();
    reset();
    navigate("/");
    toast.show("Signed out");
  };

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
              <Item
                Icon={Store}
                label="Enrolled brands"
                onClick={() => {
                  setOpen(false);
                  navigate("/brands");
                }}
              />
              <Item
                Icon={SettingsIcon}
                label="Settings"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
              />
              <Item
                Icon={Lock}
                label="Privacy"
                onClick={() => {
                  setOpen(false);
                  navigate("/privacy");
                }}
              />
            </nav>

            <div className="mt-auto">
              <div className="border-t border-hairline px-2 pt-2">
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-button px-3 py-3.5 text-left active:bg-surface"
                >
                  <LogOut size={20} className="text-ink-muted" />
                  <span className="flex-1 text-body font-semibold text-ink">Sign out</span>
                </button>
              </div>
              <p className="flex items-center gap-1.5 px-4 pb-8 pt-2 text-caption text-ink-muted">
                <ShieldCheck size={14} className="shrink-0 text-primary" /> Read-only access ·
                payout-blind ranking
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Item({
  Icon,
  label,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-button px-3 py-3.5 text-left active:bg-surface"
    >
      <Icon size={20} className="text-ink-muted" />
      <span className="flex-1 text-body font-semibold text-ink">{label}</span>
      <ChevronRight size={18} className="text-ink-muted" />
    </button>
  );
}
