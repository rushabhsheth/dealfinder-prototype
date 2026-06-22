import type { ReactNode } from "react";
import HeaderMenu from "./HeaderMenu";
import AgentButton from "./AgentButton";

/**
 * TopAppBar — shared chrome for the main tab screens: hamburger menu (top-left),
 * a centered title, and the AI agent (top-right). Screen-specific content
 * (segmented control, subtitle, …) renders below via `children`.
 */
export default function TopAppBar({
  title,
  children,
}: {
  title?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="shrink-0 bg-surface pt-1">
      <div className="flex h-14 items-center justify-between px-2">
        <HeaderMenu />
        <h1 className="truncate px-2 text-h2 text-ink">{title}</h1>
        <AgentButton />
      </div>
      {children && <div className="px-4 pb-2">{children}</div>}
    </header>
  );
}
