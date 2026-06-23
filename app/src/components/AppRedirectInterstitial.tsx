import { Smartphone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * AppRedirectInterstitial — the Phase-B "continue in the app" surface
 * (RESPONSIVE_WEB_PRD.md §7). Rendered by AppShell when `gateFor(pathname)` is
 * `app-redirect`. In Phase A no surface is gated, so this never shows; it exists
 * so withdrawing a feature from web later is a config flip, not a rebuild.
 */
export default function AppRedirectInterstitial({ surface }: { surface: string }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary-tint text-primary">
        <Smartphone size={36} strokeWidth={1.75} />
      </div>
      <h1 className="mt-6 text-h1 text-ink">Continue in the app</h1>
      <p className="mt-2 text-body text-ink-muted">
        {surface ? `“${surface}” is` : "This is"} available in the DealFinder app. Get the app to
        pick up right where you left off.
      </p>
      <button
        onClick={() => navigate("/feed")}
        className="mt-6 flex items-center gap-2 rounded-button border border-hairline bg-card px-4 py-2.5 text-label font-semibold text-ink transition-colors hover:bg-surface"
      >
        <ArrowLeft size={16} /> Back to deals
      </button>
    </div>
  );
}
