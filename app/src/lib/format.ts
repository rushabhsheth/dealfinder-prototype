// Formatting helpers. Money is always USD; the demo's "today" is 2026-06-15.

export const DEMO_TODAY = new Date("2026-06-15T12:00:00");

export function usd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "30% off" */
export function percentOff(percent: number): string {
  return `${percent}% off`;
}

/** Days from the demo "today" until an ISO expiry date (negative = expired). */
export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T12:00:00`);
  const ms = target.getTime() - DEMO_TODAY.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Human expiry copy: "Ends today", "Ends tomorrow", "Ends in 3 days", "Jun 30". */
export function expiryLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return "Expired";
  if (d === 0) return "Ends today";
  if (d === 1) return "Ends tomorrow";
  if (d <= 6) return `Ends in ${d} days`;
  return `Ends ${shortDate(iso)}`;
}

/** Parse a date that may be date-only ("2026-06-14") or a full ISO timestamp
 *  (backend `timestamptz`). Returns null for empty/invalid input. */
function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human "sent" copy for when an offer landed: "Sent today", "Sent yesterday",
 *  "Sent 3 days ago", "Sent Jun 8". Empty string when the date is unknown. */
export function receivedLabel(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "";
  const days = Math.round((date.getTime() - DEMO_TODAY.getTime()) / (1000 * 60 * 60 * 24));
  if (days >= 0) return "Sent today"; // today or (defensively) future
  if (days === -1) return "Sent yesterday";
  if (days >= -6) return `Sent ${-days} days ago`;
  return `Sent ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/** True when a deal is urgent enough to warrant the amber badge. */
export function isUrgent(iso: string): boolean {
  const d = daysUntil(iso);
  return d >= 0 && d <= 3;
}

export function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
