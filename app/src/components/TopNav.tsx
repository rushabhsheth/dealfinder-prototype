import { NavLink, useNavigate } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { useDemo } from "../state/DemoContext";
import Wordmark from "./Wordmark";
import AccountMenu from "./AccountMenu";

/**
 * TopNav — the persistent desktop/tablet top bar (RESPONSIVE_WEB_PRD.md §5).
 * One nav model, reflowed: this is shown at md+ (hidden on mobile, where the
 * BottomNav + drawer take over). Premium-locked destinations stay visible with
 * a small lock affordance for free users (visible-but-locked), never hidden.
 * Right slot is auth-driven: Log in / Start free trial when signed-out, the
 * account dropdown when signed-in.
 */
const LINKS: { label: string; to: string; premium?: boolean }[] = [
  { label: "Deals", to: "/feed" },
  { label: "Watches", to: "/watches", premium: true },
  { label: "Savings", to: "/savings" },
  { label: "Scout", to: "/chat" },
];

export default function TopNav() {
  const navigate = useNavigate();
  const { signedIn, tier } = useDemo();
  const isPremium = tier === "trial" || tier === "paid";

  return (
    <header className="sticky top-0 z-40 hidden border-b border-hairline bg-surface/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 w-full max-w-content items-center gap-6 px-6 lg:px-8">
        <Wordmark to={signedIn ? "/feed" : "/"} />

        <nav className="flex items-center gap-1">
          {LINKS.map(({ label, to, premium }) => {
            const locked = premium && !isPremium;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-button px-3 py-2 text-label font-semibold transition-colors ${
                    isActive ? "bg-primary-tint/60 text-primary-pressed" : "text-ink-muted hover:text-ink"
                  }`
                }
              >
                {label}
                {locked && <Lock size={12} className="opacity-70" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <AccountMenu />
          ) : (
            <>
              <button
                onClick={() => navigate("/signin")}
                className="rounded-button px-3 py-2 text-label font-semibold text-ink transition-colors hover:bg-card"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/trial")}
                className="flex items-center gap-1.5 rounded-button bg-accent px-4 py-2 text-label font-semibold text-white transition-colors hover:bg-accent-pressed"
              >
                <Sparkles size={15} /> Start free trial
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
