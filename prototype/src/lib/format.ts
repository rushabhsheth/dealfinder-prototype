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
