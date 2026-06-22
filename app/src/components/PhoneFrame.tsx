import type { ReactNode } from "react";

/**
 * Renders the app inside a phone-sized device on desktop. The prototype is a
 * web preview of a mobile app, so we frame it at ~390×844 with light device
 * chrome (notch, status bar). On a real phone it still reads naturally.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center p-0 sm:min-h-screen sm:p-6">
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface sm:h-[844px] sm:max-h-screen sm:max-w-phone sm:rounded-[44px] sm:border-[10px] sm:border-[#1c1c1e] sm:shadow-2xl"
      >
        {/* Simulated device chrome — desktop only; a real phone draws its own. */}
        {/* Notch */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-[#1c1c1e] sm:block" />

        {/* Status bar */}
        <div className="relative z-20 hidden h-11 shrink-0 items-center justify-between px-6 pt-1 text-[13px] font-semibold text-ink sm:flex">
          <span className="nums">9:41</span>
          <div className="flex items-center gap-1.5">
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* App viewport */}
        <div className="no-scrollbar relative z-10 flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
      <path d="M8 2.2c2.5 0 4.8 1 6.5 2.6l-1.4 1.5A7 7 0 0 0 8 4.3 7 7 0 0 0 2.9 6.3L1.5 4.8A9.4 9.4 0 0 1 8 2.2Z" />
      <path d="M8 6.1c1.4 0 2.7.55 3.6 1.45l-1.4 1.5A2.9 2.9 0 0 0 8 8.2c-.85 0-1.6.32-2.2.85l-1.4-1.5A5.2 5.2 0 0 1 8 6.1Z" />
      <circle cx="8" cy="10" r="1.2" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
      <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
      <rect x="24" y="4" width="2" height="5" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
