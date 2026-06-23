import { Loader2, AlertCircle, Inbox, RotateCw } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared loading / empty / error states for mailbox-backed screens
 * (CLAUDE.WEBAPP.md hard rule 7: honest states, no UI that silently lies).
 * Calm and on-brand — a spinner and a plain line, never a scary error wall.
 */
type Variant = "loading" | "empty" | "error";

export default function ScreenState({
  variant,
  title,
  message,
  onRetry,
  action,
}: {
  variant: Variant;
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  if (variant === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <Loader2 size={26} className="animate-spin text-primary" />
        <p className="text-caption text-ink-muted">{message ?? "Loading…"}</p>
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint">
          <Inbox size={22} className="text-primary" />
        </span>
        <p className="mt-1 text-body font-semibold text-ink">{title ?? "Nothing here yet"}</p>
        {message && <p className="max-w-xs text-caption text-ink-muted">{message}</p>}
        {action && <div className="mt-3 w-full max-w-xs">{action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
      <AlertCircle size={24} className="text-danger" />
      <p className="mt-1 text-body font-semibold text-ink">{title ?? "Couldn't load this"}</p>
      {message && <p className="max-w-xs text-caption text-ink-muted">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-button border border-hairline bg-card px-4 py-2 text-label font-semibold text-ink active:scale-[0.99]"
        >
          <RotateCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
