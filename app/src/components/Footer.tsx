import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Wordmark from "./Wordmark";

/**
 * Footer — the Going-style persistent IA safety net, shared at every breakpoint
 * (RESPONSIVE_WEB_PRD.md §4). Carries the long tail (About / How it works,
 * Privacy, Terms, Help) plus the payout-blind trust line, reinforcing the brand
 * on every page. Columns reflow to a stack on mobile.
 */
const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "How it works", to: "/" },
      { label: "All deals", to: "/feed" },
      { label: "Travel watches", to: "/watches" },
      { label: "Savings", to: "/savings" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/" },
      { label: "Help", to: "/" },
      { label: "Scout assistant", to: "/chat" },
    ],
  },
  {
    heading: "Trust & legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Settings", to: "/settings" },
      { label: "Terms", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline bg-surface">
      <div className="mx-auto w-full max-w-content px-4 py-10 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Wordmark />
            <p className="mt-3 max-w-[16rem] text-caption text-ink-muted">
              An AI agent that reads your inbox for real savings — ranked by what fits you, never by
              who pays us.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-label font-semibold text-ink">{col.heading}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-caption text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-caption text-ink-muted">
            <ShieldCheck size={14} className="text-primary" />
            Trust: we never rank by payout.
          </p>
          <p className="text-caption text-ink-muted">© {2026} DealFinder</p>
        </div>
      </div>
    </footer>
  );
}
