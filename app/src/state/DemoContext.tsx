import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Tier } from "../types";

/**
 * Demo state for the prototype. No backend — just React state mirrored to
 * localStorage for demo continuity. Tracks the entitlement tier (free / trial /
 * paid) so we can walk both demo paths and show the downgrade, plus which deals
 * have been "redeemed" in this session.
 */
interface DemoState {
  tier: Tier;
  setTier: (t: Tier) => void;
  /** True once a trial has lapsed without conversion — drives the downgrade UI. */
  downgraded: boolean;
  redeemedIds: string[];
  redeem: (dealId: string) => void;
  hasRedeemed: (dealId: string) => boolean;
  /** Convert/restart premium: trial or paid, clears the downgrade flag. */
  goPremium: (t: "trial" | "paid") => void;
  /** Decline the paywall: drop to free and mark downgraded. */
  downgrade: () => void;
  /** Connect-inbox nudge. Dismissal is in-memory only, so it returns on every
   *  fresh app open (per request) but stays hidden while navigating around. */
  nudgeDismissed: boolean;
  dismissNudge: () => void;
  reset: () => void;
}

const STORAGE_KEY = "dealfinder.demo.v1";

const DemoContext = createContext<DemoState | null>(null);

interface Persisted {
  tier: Tier;
  downgraded: boolean;
  redeemedIds: string[];
}

function load(): Persisted {
  const defaults: Persisted = { tier: "trial", downgraded: false, redeemedIds: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    // ignore — fall through to defaults
  }
  return defaults;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [tier, setTierState] = useState<Tier>(initial.tier);
  const [downgraded, setDowngraded] = useState<boolean>(initial.downgraded);
  const [redeemedIds, setRedeemedIds] = useState<string[]>(initial.redeemedIds);
  // In-memory only — intentionally not persisted, so the nudge reappears on reload.
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tier, downgraded, redeemedIds })
      );
    } catch {
      // ignore quota / private-mode errors
    }
  }, [tier, downgraded, redeemedIds]);

  const setTier = useCallback((t: Tier) => setTierState(t), []);

  const goPremium = useCallback((t: "trial" | "paid") => {
    setTierState(t);
    setDowngraded(false);
  }, []);

  const downgrade = useCallback(() => {
    setTierState("free");
    setDowngraded(true);
  }, []);

  const dismissNudge = useCallback(() => setNudgeDismissed(true), []);

  const redeem = useCallback((dealId: string) => {
    setRedeemedIds((ids) => (ids.includes(dealId) ? ids : [...ids, dealId]));
  }, []);

  const hasRedeemed = useCallback(
    (dealId: string) => redeemedIds.includes(dealId),
    [redeemedIds]
  );

  const reset = useCallback(() => {
    setTierState("trial");
    setDowngraded(false);
    setRedeemedIds([]);
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      tier,
      setTier,
      downgraded,
      redeemedIds,
      redeem,
      hasRedeemed,
      goPremium,
      downgrade,
      nudgeDismissed,
      dismissNudge,
      reset,
    }),
    [
      tier,
      setTier,
      downgraded,
      redeemedIds,
      redeem,
      hasRedeemed,
      goPremium,
      downgrade,
      nudgeDismissed,
      dismissNudge,
      reset,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
