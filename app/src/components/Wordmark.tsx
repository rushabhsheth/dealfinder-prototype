import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Wordmark — the DealFinder logo lockup, reused in the top nav, footer, mobile
 * app bar, and marketing landing. Links to `to` (defaults to the front door).
 */
export default function Wordmark({
  to = "/",
  size = "md",
}: {
  to?: string;
  size?: "sm" | "md";
}) {
  const icon = size === "sm" ? 14 : 16;
  const text = size === "sm" ? "text-body" : "text-h2";
  const box = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="DealFinder home">
      <span
        className={`flex ${box} items-center justify-center rounded-lg bg-primary text-white`}
      >
        <Sparkles size={icon} strokeWidth={2.25} />
      </span>
      <span className={`${text} font-bold tracking-tight text-ink`}>
        Deal<span className="text-primary">Finder</span>
      </span>
    </Link>
  );
}
