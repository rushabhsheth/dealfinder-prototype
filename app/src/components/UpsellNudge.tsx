import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useDemo } from "../state/DemoContext";

/**
 * UpsellNudge — the apricot "get deals just for you" card. Shows on app open
 * for free users; dismissible via the X (top-right). Dismissal is in-memory
 * (DemoContext), so it returns on the next fresh open.
 */
export default function UpsellNudge() {
  const navigate = useNavigate();
  const { dismissNudge } = useDemo();

  return (
    <div className="relative mb-3 overflow-hidden rounded-card bg-gradient-to-r from-accent to-accent-pressed p-4 text-white shadow-card">
      <button
        aria-label="Dismiss"
        onClick={dismissNudge}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white/90 active:bg-white/20"
      >
        <X size={16} />
      </button>

      <button onClick={() => navigate("/trial")} className="block w-full pr-6 text-left">
        <p className="flex items-center gap-1.5 text-label font-semibold">
          <Sparkles size={16} /> Get deals just for you
        </p>
        <p className="mt-1 text-caption text-white/90">
          Connect your inbox and we'll find personalized savings — free for 14 days.
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-label font-semibold">
          Start free trial <ArrowRight size={16} />
        </span>
      </button>
    </div>
  );
}
