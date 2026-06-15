import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared list primitives for the Settings and Privacy screens: a labelled
 * card group, a row with leading icon + title/subtitle + trailing control, and
 * the on/off toggle.
 */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      <div className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-card shadow-card">
        {children}
      </div>
    </div>
  );
}

export function Row({
  Icon,
  title,
  subtitle,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon size={20} className="text-ink-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{title}</p>
        <p className="truncate text-caption text-ink-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-hairline"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
