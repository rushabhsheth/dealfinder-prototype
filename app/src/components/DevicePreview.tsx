import { X } from "lucide-react";
import PhoneFrame from "./PhoneFrame";

/**
 * DevicePreview — the opt-in "phone on a desktop" demo view (?frame=phone).
 *
 * It renders the app inside an <iframe> wrapped in PhoneFrame. The iframe is the
 * key: CSS media queries resolve against the *iframe's* viewport width (~the
 * phone frame, <768px), so the real MOBILE layout renders — unlike wrapping the
 * app directly, where the breakpoints still see the full desktop viewport. The
 * iframe loads the same route on the same origin (shared localStorage → demo
 * state carries over), minus the `frame` param so it doesn't recurse.
 */
export default function DevicePreview() {
  const url = new URL(window.location.href);
  url.searchParams.delete("frame");
  const src = url.pathname + url.search + url.hash;

  const exit = () => {
    const u = new URL(window.location.href);
    u.searchParams.delete("frame");
    window.location.href = u.pathname + u.search + u.hash || "/";
  };

  return (
    <div className="relative">
      <button
        onClick={exit}
        className="fixed right-4 top-4 z-[70] flex items-center gap-1.5 rounded-button bg-ink/85 px-3 py-2 text-label font-semibold text-white shadow-xl backdrop-blur active:scale-95"
      >
        <X size={16} /> Exit phone preview
      </button>
      <PhoneFrame>
        <iframe
          title="DealFinder mobile preview"
          src={src}
          className="h-full w-full border-0 bg-surface"
        />
      </PhoneFrame>
    </div>
  );
}
