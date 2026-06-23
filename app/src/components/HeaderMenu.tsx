import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Plane,
  PiggyBank,
  Sparkles,
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  Store,
  LogOut,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useDemo } from "../state/DemoContext";
import { useToast } from "./Toast";
import { signOut as apiSignOut } from "../lib/api";
import TierBadge from "./TierBadge";

/**
 * HeaderMenu — the mobile drawer (RESPONSIVE_WEB_PRD.md §5). Opened from the
 * mobile app bar's hamburger. Carries a tier-aware header plus the primary
 * destinations (the mobile analog of the desktop TopNav + account dropdown) and
 * the trust/control surfaces. Contents are auth-driven: signed-in shows the
 * account + Sign out; signed-out shows Log in / Start free trial.
 */
const PRIMARY: { label: string; to: string; Icon: LucideIcon }[] = [
  { label: "Deals", to: "/feed", Icon: Home },
  { label: "Travel watches", to: "/watches", Icon: Plane },
  { label: "Savings", to: "/savings", Icon: PiggyBank },
  { label: "Scout assistant", to: "/chat", Icon: Sparkles },
];

const SECONDARY: { label: string; to: string; Icon: LucideIcon }[] = [
  { label: "Enrolled brands", to: "/brands", Icon: Store },
  { label: "Settings", to: "/settings", Icon: SettingsIcon },
  { label: "Privacy", to: "/privacy", Icon: Lock },
];

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signedIn, setSignedIn, reset } = useDemo();
  const toast = useToast();

  const close = () => setOpen(false);
  const go = (to: string) => {
    close();
    navigate(to);
  };

  const signOut = () => {
    close();
    void apiSignOut();
    reset();
    setSignedIn(false);
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

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex justify-start">
            <button aria-label="Close menu" onClick={close} className="absolute inset-0 bg-ink/40" />

          {/* Panel — slides in from the left (hamburger lives top-left) */}
          <div className="animate-slide-in-left relative z-10 flex h-full w-72 max-w-[82%] flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-4">
              {signedIn ? (
                <div className="flex items-center gap-2">
                  <span className="text-h2 text-ink">You</span>
                  <TierBadge />
                </div>
              ) : (
                <span className="text-h2 text-ink">Welcome</span>
              )}
              <button
                aria-label="Close"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted active:bg-black/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2">
              <nav>
                {PRIMARY.map(({ label, to, Icon }) => (
                  <DrawerLink key={to} to={to} label={label} Icon={Icon} onClick={close} />
                ))}
              </nav>
              <div className="my-2 border-t border-hairline" />
              <nav>
                {SECONDARY.map(({ label, to, Icon }) => (
                  <DrawerLink key={to} to={to} label={label} Icon={Icon} onClick={close} />
                ))}
              </nav>
            </div>

            <div className="border-t border-hairline px-2 pt-2">
              {signedIn ? (
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-button px-3 py-3.5 text-left active:bg-surface"
                >
                  <LogOut size={20} className="text-ink-muted" />
                  <span className="flex-1 text-body font-semibold text-ink">Sign out</span>
                </button>
              ) : (
                <div className="space-y-2 px-1 pb-1">
                  <button
                    onClick={() => go("/trial")}
                    className="flex w-full items-center justify-center gap-2 rounded-button bg-accent py-3 text-label font-semibold text-white"
                  >
                    Start free trial <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => go("/signin")}
                    className="w-full rounded-button border border-hairline py-3 text-label font-semibold text-ink"
                  >
                    Log in
                  </button>
                </div>
              )}
              <p className="flex items-center gap-1.5 px-4 pb-8 pt-2 text-caption text-ink-muted">
                <ShieldCheck size={14} className="shrink-0 text-primary" /> Read-only access ·
                payout-blind ranking
              </p>
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
}

function DrawerLink({
  to,
  label,
  Icon,
  onClick,
}: {
  to: string;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-button px-3 py-3 text-left transition-colors ${
          isActive ? "bg-primary-tint/50 text-primary-pressed" : "text-ink active:bg-surface"
        }`
      }
    >
      <Icon size={20} className="text-ink-muted" />
      <span className="flex-1 text-body font-semibold">{label}</span>
    </NavLink>
  );
}
