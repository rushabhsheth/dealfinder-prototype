import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BrandStatus, Tier, UserPreferences } from "../types";
import { DEFAULT_PREFERENCES } from "../lib/preferences";

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
  /** Personalization inputs from the Interest Survey / Settings → Preferences. */
  preferences: UserPreferences;
  setPreferences: (patch: Partial<UserPreferences>) => void;
  /** Per-brand status changes the user makes in Enrolled Brands (pause /
   *  unsubscribe / re-enroll), overriding each brand's baseline status. */
  brandStatus: Record<string, BrandStatus>;
  setBrandStatus: (brandId: string, status: BrandStatus) => void;
  /** Whether the inbox is connected. Set during onboarding or later from
   *  Privacy via the Connect Inbox screen. */
  inboxConnected: boolean;
  setInboxConnected: (connected: boolean) => void;
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
  preferences: UserPreferences;
  brandStatus: Record<string, BrandStatus>;
  inboxConnected: boolean;
}

function load(): Persisted {
  const defaults: Persisted = {
    tier: "trial",
    downgraded: false,
    redeemedIds: [],
    preferences: DEFAULT_PREFERENCES,
    brandStatus: {},
    inboxConnected: true,
  };
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
  const [preferences, setPreferencesState] = useState<UserPreferences>(initial.preferences);
  const [brandStatus, setBrandStatusState] = useState<Record<string, BrandStatus>>(
    initial.brandStatus
  );
  const [inboxConnected, setInboxConnected] = useState<boolean>(initial.inboxConnected);
  // In-memory only — intentionally not persisted, so the nudge reappears on reload.
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tier, downgraded, redeemedIds, preferences, brandStatus, inboxConnected })
      );
    } catch {
      // ignore quota / private-mode errors
    }
  }, [tier, downgraded, redeemedIds, preferences, brandStatus, inboxConnected]);

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

  const setPreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setBrandStatus = useCallback((brandId: string, status: BrandStatus) => {
    setBrandStatusState((prev) => ({ ...prev, [brandId]: status }));
  }, []);

  const reset = useCallback(() => {
    setTierState("trial");
    setDowngraded(false);
    setRedeemedIds([]);
    setPreferencesState(DEFAULT_PREFERENCES);
    setBrandStatusState({});
    setInboxConnected(true);
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      tier,
      setTier,
      downgraded,
      redeemedIds,
      redeem,
      hasRedeemed,
      preferences,
      setPreferences,
      brandStatus,
      setBrandStatus,
      inboxConnected,
      setInboxConnected,
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
      preferences,
      setPreferences,
      brandStatus,
      setBrandStatus,
      inboxConnected,
      setInboxConnected,
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
