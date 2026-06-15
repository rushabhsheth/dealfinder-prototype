import { useNavigate } from "react-router-dom";
import { ScanSearch, Sparkles, UserCheck, ArrowRight, type LucideIcon } from "lucide-react";
import { savings } from "../lib/data";
import PrimaryButton from "../components/PrimaryButton";
import TopBar from "../components/TopBar";

/**
 * Screen 3 — Trial Intro / Start Trial. Apricot-accent hero, three benefit
 * bullets, "Start free trial" (accent), "no charge for 14 days".
 */
interface Benefit {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const BENEFITS: Benefit[] = [
  {
    Icon: ScanSearch,
    title: "Inbox scan",
    body: "We read your offers and receipts (read-only) to find deals you'd otherwise miss.",
  },
  {
    Icon: Sparkles,
    title: "Personal ranking",
    body: "Offers ranked by what fits you — never by who pays us. Brands can't buy placement.",
  },
  {
    Icon: UserCheck,
    title: "Auto-enroll",
    body: "We join the high-value newsletters worth it, and you can unsubscribe in one tap.",
  },
];

export default function TrialIntro() {
  const navigate = useNavigate();
  const { trial } = savings;

  return (
    <div className="flex h-full flex-col bg-surface">
      <TopBar back="/free" transparent />

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-28">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-badge bg-accent-tint px-3 py-1 text-label font-semibold text-accent-pressed">
            <Sparkles size={14} /> Premium · free for {trial.lengthDays} days
          </span>
          <h1 className="mt-4 text-h1 text-ink">Your own savings agent</h1>
          <p className="mt-2 text-body text-ink-muted">
            DealFinder works in the background — scanning, ranking, and watching prices so you keep
            more of your money.
          </p>
        </div>

        <div className="mt-7 space-y-3">
          {BENEFITS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-card border border-hairline bg-card p-4 shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent-pressed">
                <Icon size={22} />
              </span>
              <div>
                <p className="text-h2 text-ink">{title}</p>
                <p className="mt-0.5 text-caption text-ink-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        <PrimaryButton variant="accent" onClick={() => navigate("/survey")}>
          Start free trial <ArrowRight size={18} />
        </PrimaryButton>
        <p className="mt-2 text-center text-caption text-ink-muted">
          No charge for {trial.lengthDays} days · cancel anytime
        </p>
      </div>
    </div>
  );
}
