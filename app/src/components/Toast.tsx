import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";

interface ToastState {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastState | null>(null);

/**
 * Lightweight toast for confirmations (e.g. "Code copied"). Renders pinned to
 * the bottom of the phone viewport above the nav.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2">
          <div className="animate-toast flex items-center gap-2 rounded-button bg-ink px-4 py-3 text-label font-semibold text-white shadow-2xl">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-savings">
              <Check size={13} strokeWidth={3} />
            </span>
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
