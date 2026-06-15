import { Clock } from "lucide-react";
import { expiryLabel } from "../lib/format";

/**
 * UrgencyBadge — amber tint fill, amber text. "Ends in 2 days" etc.
 * Amber is reserved for expiry/urgency only (DESIGN_SYSTEM.md).
 */
export default function UrgencyBadge({ expiresAt }: { expiresAt: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-badge bg-urgency-tint px-2.5 py-1 text-label font-semibold text-[#9a7b1f]">
      <Clock size={13} strokeWidth={2.5} />
      {expiryLabel(expiresAt)}
    </span>
  );
}
