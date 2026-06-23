import type { ReactNode } from "react";

/**
 * ScreenHeader — a lightweight page header for app screens. Navigation chrome
 * now lives in the AppShell (TopNav / drawer), so this just renders the screen
 * title and an optional sub-toolbar row (segmented control, filters, actions).
 * Replaces the old per-screen TopAppBar.
 */
export default function ScreenHeader({
  title,
  children,
  actions,
}: {
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-h1 text-ink md:text-display">{title}</h1>
        {actions}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
