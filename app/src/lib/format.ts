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

/** Days from the demo "today" until an expiry date (negative = expired).
 *  Returns NaN for missing/unparseable input. Accepts date-only or full ISO
 *  (the backend's `timestamptz`) via parseDate. */
export function daysUntil(iso: string | null | undefined): number {
  const target = parseDate(iso);
  if (!target) return NaN;
  return Math.round((target.getTime() - DEMO_TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

/** Human expiry copy: "Ends today", "Ends tomorrow", "Ends in 3 days", "Ends
 *  Jun 30". Empty string when the expiry is unknown/unparseable (so cards never
 *  render "Ends Invalid Date"). */
export function expiryLabel(iso: string | null | undefined): string {
  const d = daysUntil(iso);
  if (Number.isNaN(d)) return "";
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
export function isUrgent(iso: string | null | undefined): boolean {
  const d = daysUntil(iso);
  return !Number.isNaN(d) && d >= 0 && d <= 3;
}

/** "Jun 30" — accepts date-only or full ISO; "" for missing/unparseable. */
export function shortDate(iso: string | null | undefined): string {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
}
