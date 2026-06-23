import { useNavigate } from "react-router-dom";
import { Mail, Sparkles, ShieldCheck, ArrowRight, Lock, type LucideIcon } from "lucide-react";
import { publicDeals } from "../lib/data";
import DealCard from "../components/DealCard";

/**
 * Landing — the signed-out, trust-first marketing home (RESPONSIVE_WEB_PRD.md §4
 * & decision: a dedicated desktop hero, not the swipe panels). Leads with the
 * read-only / payout-blind promise, explains how it works, then shows the real
 * public All-Deals catalog as a teaser (value first, personalization gated).
 * Full-bleed sections; stacks on mobile. The swipe ValueExplainer remains the
 * mobile on-ramp at /intro.
 */
const STEPS: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: Mail,
    title: "Deals hide in your inbox",
    body: "Newsletters, receipts, and offers pile up. DealFinder reads them so you don't have to — and surfaces the few that matter.",
  },
  {
    Icon: Sparkles,
    title: "Ranked just for you",
    body: "We learn what you buy and where you travel, then rank real savings — dollars off, percent off, ending soon — by what fits your life.",
  },
  {
    Icon: ShieldCheck,
    title: "We work for you, not brands",
    body: "Read-only access. Ranking is never influenced by payout. Disconnect and delete your data anytime.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const teaser = publicDeals.slice(0, 6);

  return (
    <div>
      {/* Hero — light sky band */}
      <section className="border-b border-hairline bg-gradient-to-b from-sky-tint to-surface">
        <div className="mx-auto w-full max-w-content px-4 py-16 text-center md:px-6 md:py-24 lg:px-8">
          <p className="mx-auto flex w-fit items-center gap-1.5 rounded-badge border border-hairline bg-card px-3 py-1 text-caption font-semibold text-primary">
            <ShieldCheck size={14} /> Read-only · payout-blind ranking
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-3xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
            An agent that reads your inbox for real savings — never sells your rank.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-body text-ink-muted md:text-lg">
            DealFinder scans your inbox (read-only) and ranks the offers worth your time by fit,
            savings, and timing. Brands never pay to rank higher.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/trial")}
              className="flex w-full items-center justify-center gap-2 rounded-button bg-accent px-6 py-3.5 text-label font-semibold text-ink transition-colors hover:bg-accent-pressed sm:w-auto"
            >
              Start free trial <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate("/feed")}
              className="flex w-full items-center justify-center gap-2 rounded-button border border-hairline bg-card px-6 py-3.5 text-label font-semibold text-ink transition-colors hover:border-ink-muted/40 sm:w-auto"
            >
              Browse all deals
            </button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-caption text-ink-muted">
            <Lock size={13} /> Free for 14 days · cancel anytime
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-content px-4 py-16 md:px-6 lg:px-8">
        <h2 className="text-center text-h1 text-ink">How DealFinder works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-card border border-hairline bg-card p-6 shadow-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary-tint text-primary">
                <Icon size={28} strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 text-h2 text-ink">{title}</h3>
              <p className="mt-2 text-body text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Public deals teaser — pale lime band */}
      <section className="border-t border-hairline bg-accent-tint/30">
        <div className="mx-auto w-full max-w-content px-4 py-16 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-h1 text-ink">Live public deals</h2>
              <p className="mt-1 text-body text-ink-muted">
                Same for everyone — sign in to unlock deals picked just for you.
              </p>
            </div>
            <button
              onClick={() => navigate("/feed")}
              className="flex items-center gap-1.5 text-label font-semibold text-primary"
            >
              See all <ArrowRight size={16} />
            </button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teaser.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — deep forest band */}
      <section className="bg-primary">
        <div className="mx-auto w-full max-w-content px-4 py-16 text-center md:px-6 lg:px-8">
          <h2 className="mx-auto max-w-2xl text-h1 text-white">
            Stop hunting for codes. Let an agent that works for you do it.
          </h2>
          <button
            onClick={() => navigate("/trial")}
            className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-button bg-accent px-6 py-3.5 text-label font-semibold text-ink transition-colors hover:bg-accent-pressed"
          >
            Start free trial <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
