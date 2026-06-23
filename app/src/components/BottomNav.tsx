import { NavLink } from "react-router-dom";
import { Home, Plane, PiggyBank, type LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { to: "/feed", label: "Deals", Icon: Home },
  { to: "/watches", label: "Flights", Icon: Plane },
  { to: "/savings", label: "Savings", Icon: PiggyBank },
];

/** BottomNav — Deals, Flights, Savings. Active item in teal. Mobile-only: the
 *  desktop/tablet TopNav takes over at md+. Fixed to the viewport bottom; the
 *  AppShell pads its content (pb-16) so nothing hides behind it. Settings lives
 *  in the drawer (HeaderMenu). */
export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-card/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-5 pt-2">
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-label transition-colors ${
                isActive ? "text-primary" : "text-ink-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] font-semibold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
