import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  PiggyBank,
  Store,
  Settings as SettingsIcon,
  Lock,
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useDemo } from "../state/DemoContext";
import { useToast } from "./Toast";
import { signOut as apiSignOut } from "../lib/api";
import TierBadge from "./TierBadge";

/**
 * AccountMenu — the desktop top-bar account dropdown (RESPONSIVE_WEB_PRD.md §5).
 * Shows the tier badge and opens the secondary surfaces (Savings, Enrolled
 * Brands, Settings, Privacy, Help, Sign out) — the desktop analog of the mobile
 * drawer. Only rendered when signed in.
 */
const ITEMS: { label: string; to: string; Icon: LucideIcon }[] = [
  { label: "Savings", to: "/savings", Icon: PiggyBank },
  { label: "Enrolled brands", to: "/brands", Icon: Store },
  { label: "Settings", to: "/settings", Icon: SettingsIcon },
  { label: "Privacy", to: "/privacy", Icon: Lock },
  { label: "Help", to: "/", Icon: HelpCircle },
];

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setSignedIn, reset } = useDemo();
  const toast = useToast();

  const signOut = () => {
    setOpen(false);
    void apiSignOut();
    reset();
    setSignedIn(false);
    navigate("/");
    toast.show("Signed out");
  };

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-button border border-hairline bg-card px-3 py-1.5 text-label font-semibold text-ink transition-colors hover:border-ink-muted/40"
      >
        <span>You</span>
        <TierBadge />
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {createPortal(
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />,
            document.body
          )}
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-card border border-hairline bg-card p-1.5 shadow-card"
          >
            {ITEMS.map(({ label, to, Icon }) => (
              <button
                key={label}
                role="menuitem"
                onClick={() => go(to)}
                className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-left text-body font-medium text-ink transition-colors hover:bg-surface"
              >
                <Icon size={18} className="text-ink-muted" />
                {label}
              </button>
            ))}
            <div className="my-1 border-t border-hairline" />
            <button
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-left text-body font-medium text-ink transition-colors hover:bg-surface"
            >
              <LogOut size={18} className="text-ink-muted" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
