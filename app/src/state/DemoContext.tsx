import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BrandStatus, DealInterest, Tier, UserPreferences } from "../types";
import { DEFAULT_PREFERENCES } from "../lib/preferences";
import {
  backendEnabled,
  getEntitlement,
  startTrial,
  subscribePlan,
  cancelPlan,
} from "../lib/api";

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
  /** Per-deal interest signal (Interested / Maybe / Not for me) the user sets
   *  from the feed. `null` clears it. Drives feed grouping/hiding, demo-only. */
  interest: Record<string, DealInterest>;
  setInterest: (dealId: string, value: DealInterest | null) => void;
  getInterest: (dealId: string) => DealInterest | null;
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
  /** Convert/restart premium: trial or paid, clears the downgrade flag. In
   *  backend mode this also persists the entitlement server-side; await it when
   *  ordering matters (e.g. start trial before a gated scan). */
  goPremium: (t: "trial" | "paid") => Promise<void>;
  /** Decline the paywall: drop to free and mark downgraded (+ server in backend mode). */
  downgrade: () => Promise<void>;
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
  interest: Record<string, DealInterest>;
  preferences: UserPreferences;
  brandStatus: Record<string, BrandStatus>;
  inboxConnected: boolean;
}

function load(): Persisted {
  const defaults: Persisted = {
    tier: "trial",
    downgraded: false,
    redeemedIds: [],
    interest: {},
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
  const [interest, setInterestState] = useState<Record<string, DealInterest>>(initial.interest);
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
        JSON.stringify({
          tier,
          downgraded,
          redeemedIds,
          interest,
          preferences,
          brandStatus,
          inboxConnected,
        })
      );
    } catch {
      // ignore quota / private-mode errors
    }
  }, [tier, downgraded, redeemedIds, interest, preferences, brandStatus, inboxConnected]);

  const setTier = useCallback((t: Tier) => setTierState(t), []);

  // On startup in backend mode, the server's entitlement is the source of truth
  // (lazy trial-expiry lives there). Reconcile the local tier with it; if the
  // user isn't signed in yet, getEntitlement 401s and we keep the local value.
  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    getEntitlement()
      .then(({ entitlement }) => {
        if (!active) return;
        setTierState(entitlement.tier);
        setDowngraded(entitlement.downgraded);
      })
      .catch(() => {
        /* not signed in / offline — keep local demo state */
      });
    return () => {
      active = false;
    };
  }, []);

  const goPremium = useCallback(async (t: "trial" | "paid") => {
    setTierState(t); // optimistic
    setDowngraded(false);
    if (!backendEnabled) return;
    try {
      const { entitlement } = t === "trial" ? await startTrial() : await subscribePlan();
      setTierState(entitlement.tier);
      setDowngraded(entitlement.downgraded);
    } catch {
      /* keep optimistic state; server reconciles on next load */
    }
  }, []);

  const downgrade = useCallback(async () => {
    setTierState("free"); // optimistic
    setDowngraded(true);
    if (!backendEnabled) return;
    try {
      const { entitlement } = await cancelPlan();
      setTierState(entitlement.tier);
      setDowngraded(entitlement.downgraded);
    } catch {
      /* keep optimistic state */
    }
  }, []);

  const dismissNudge = useCallback(() => setNudgeDismissed(true), []);

  const redeem = useCallback((dealId: string) => {
    setRedeemedIds((ids) => (ids.includes(dealId) ? ids : [...ids, dealId]));
  }, []);

  const hasRedeemed = useCallback(
    (dealId: string) => redeemedIds.includes(dealId),
    [redeemedIds]
  );

  const setInterest = useCallback((dealId: string, value: DealInterest | null) => {
    setInterestState((prev) => {
      if (value === null) {
        if (!(dealId in prev)) return prev;
        const next = { ...prev };
        delete next[dealId];
        return next;
      }
      return { ...prev, [dealId]: value };
    });
  }, []);

  const getInterest = useCallback(
    (dealId: string) => interest[dealId] ?? null,
    [interest]
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
    setInterestState({});
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
      interest,
      setInterest,
      getInterest,
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
      interest,
      setInterest,
      getInterest,
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
