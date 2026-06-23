// Phase-B feature-gating seam (RESPONSIVE_WEB_PRD.md §7).
//
// In Phase A every web surface is `full` — the whole product is usable on the
// web at both breakpoints. This map is the single knob that Phase B will flip:
// setting a surface to `app-redirect` makes AppShell render a "continue in the
// app" interstitial instead of the feature, replicating Going's install-driving
// strategy WITHOUT touching any screen. It is intentionally off (all `full`)
// today; do not mistake its presence for current behavior.

export type WebGate = "full" | "app-redirect";

/**
 * Per-surface gate, keyed by the leading route segment (e.g. "/feed" → "feed").
 * Add an entry only to withdraw a surface from web in Phase B. Anything not
 * listed defaults to `full`.
 */
export const webFeatureGates: Record<string, WebGate> = {
  // Phase A: everything full. Example Phase-B flip (left commented):
  // watches: "app-redirect",
};

/** Resolve the gate for a pathname. Unlisted surfaces are always `full`. */
export function gateFor(pathname: string): WebGate {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return webFeatureGates[segment] ?? "full";
}
