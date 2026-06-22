# Sub-PRD — Lifecycle & Monetization (Trial · Paywall · Downgrade)

Companion to `PRDs/DealFinder_PRD.docx` (§4.3 Trial→paid→downgrade lifecycle, §9 Pricing) and
`PRDs/DealFinder_Financial_Model.xlsx`. Sibling to `plans/SAVINGS_PRD.md` (the paywall recaps
savings) and `plans/FREE_PATH_PRD.md` (the downgrade landing). This sub-PRD scopes the
**entitlement lifecycle** — how a user moves between **free → trial → paid → downgraded** —
and the screens that drive conversion: the **Paywall / Trial Recap**, the **Subscribed**
confirmation, and the **graceful downgrade**.

It covers both layers:
- **Prototype** (now) — a demo `tier` flag in `DemoContext`, no real billing.
- **Real webapp** — an entitlement service + real billing (Stripe), forward-looking.

> **Trust at the moment of money (CLAUDE.md hard rule 6 + DESIGN_SYSTEM.md).** The paywall is
> apricot-accented (the spotlight) but never manipulative: no fake countdowns, no hidden
> cancel, no guilt copy on decline. The pitch is the recap of *real* savings, then a fair
> price. "Cancel anytime. Disconnect your inbox in one tap" is shown at the ask.

---

## 1. Problem & why now

The business is freemium: free browsing, a 14-day premium trial, then ~$96/yr. Conversion
happens at one screen — the paywall — and it must convert on **demonstrated value**, not
pressure, or it betrays the brand. Equally important is the **non-conversion** path: a user
who declines must land somewhere graceful (PRD §4.3), keep using the free tier, and have an
obvious way back — otherwise we lose them entirely and look punitive.

The pieces exist (`Paywall.tsx`, `Subscribed.tsx`, the `downgrade()`/`goPremium()` actions in
`DemoContext`, the downgrade banner in `Feed.tsx`), but the **lifecycle as a state machine**
isn't written down: what each transition does, what's entitlement-gated, and how it all maps
to a real billing system. This sub-PRD is that spec.

## 2. Goals & non-goals

**Goals**

- Convert trials to paid on **demonstrated savings**, with an honest, calm paywall.
- Make every lifecycle transition explicit and reversible-feeling: start trial, subscribe,
  cancel, downgrade, resubscribe.
- Land non-converters gracefully on the free tier with a clear resubscribe path (PRD §4.3).
- Define the **entitlement model** so all premium surfaces gate consistently and the real
  app can swap the demo flag for a real entitlement service + billing with no UX rewrite.

**Non-goals**

- No real billing, App/Play Store IAP, or Stripe in the prototype (CLAUDE.md hard rule 1 /
  out-of-scope list). Subscribe is a mocked state flip.
- Not the savings math — `SAVINGS_PRD.md` owns the recap figures the paywall displays.
- Not trial *start* mechanics (that's `ONBOARDING_PRD.md`, where `goPremium("trial")` fires
  at scan). This PRD owns trial→paid→downgrade and re-entry.

## 3. The lifecycle (state machine)

```
        ┌────────────── free ──────────────┐
        │                                   ▲
  start trial (ONBOARDING)            maybe later / cancel
        ▼                                   │  (downgrade: tier=free, downgraded=true)
       trial ──── subscribe ────►  paid ────┘
        │  (goPremium "paid")        │
   maybe later                    cancel (Settings)
        ▼                            ▼
   downgraded(free) ◄── resubscribe ── /paywall ──► paid
```

`DemoContext` actions: `goPremium("trial"|"paid")` (sets tier, clears `downgraded`),
`downgrade()` (tier=free, `downgraded`=true), `setTier`. Persisted to localStorage.

## 4. Surfaces in this PRD

| # | Surface | Route | File | State |
|---|---|---|---|---|
| 13 | Paywall / Trial Recap | `/paywall` | `screens/Paywall.tsx` | Built |
| — | Subscribed confirmation | `/subscribed` | `screens/Subscribed.tsx` | Built |
| 14 | Downgraded banner | `/feed` (All Deals) | `screens/Feed.tsx` | Built (see `FREE_PATH_PRD.md`) |
| — | Plan controls (subscribe/cancel) | `/settings` | `screens/Settings.tsx` | Built (see `SETTINGS_PRIVACY_PRD.md`) |
| — | Entitlement model | (state) | `state/DemoContext.tsx` | Built |

## 5. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 5.1 Paywall / Trial Recap (P0 — built)
- **Recap hero** (apricot gradient): leads with `cumulative.totalSaved` (**redeemed** value)
  "saved across N redeemed deals" — value first, price second. This is the core conversion
  lever, so it must read the **live** redeemed total (`SAVINGS_PRD.md` §4.3).
- **Optional surfaced line**: under the redeemed hero, a softer "Scout found you $X in deals
  overall" (surfaced value) can widen the perceived value of staying premium — but redeemed
  stays the honest headline and surfaced is clearly labeled "found," not "saved"
  (`SAVINGS_PRD.md` §4.0/§4.4). Don't let surfaced masquerade as money banked.
- Headline "Keep Scout on the case" + "your trial ends in N days."
- **Benefits** list: ranked feed, inbox auto-scan, chat agent, fare watches, auto-enroll.
- **Price** block: annual `trial.annualPrice` (~$96) with monthly equivalent and an honest
  anchor ("less than one deal usually saves you").
- Trust line at the ask: "Cancel anytime. Disconnect your inbox in one tap."
- CTAs: **"Subscribe · $X/yr"** (apricot accent) → `goPremium("paid")` → `/subscribed`;
  **"Maybe later"** (low emphasis) → `downgrade()` → `/free`.
- No dark patterns: "Maybe later" is always visible and easy; no fake scarcity timers.

### 5.2 Entry points to the paywall (P0)
- Trial nudge chip on the For You feed (`CORE_FEED_PRD.md`).
- Settings → Plan → "Upgrade" (trial) (`SETTINGS_PRIVACY_PRD.md`).
- Downgraded banner → "Resubscribe" (`FREE_PATH_PRD.md`).
- All converge on `/paywall`.

### 5.3 Subscribed confirmation (P0 — built)
- Celebratory but calm: savings-green check, "You're all set", "Premium is active. Scout keeps
  scanning, ranking, and watching fares — for $X/year."
- Single CTA back to `/feed`. Sets `tier = paid` (already done by `goPremium("paid")`).

### 5.4 Downgrade (graceful, PRD §4.3) (P0 — built)
- On "Maybe later" (or Settings → Cancel), `downgrade()` sets free + `downgraded`.
- Lands on `/free` (All Deals). A banner explains premium is paused: **inbox disconnected,
  fare watches off**, with a one-tap **Resubscribe**. (Rendered in `Feed.tsx`; copy spec in
  `FREE_PATH_PRD.md` §4.5.)
- Premium surfaces (For You, Travel Watch, Enrolled Brands) show their **locked** states, not
  errors. Nothing is deleted; it's paused.
- No guilt copy, no "you'll lose $X" pressure.

### 5.5 Resubscribe / restore (P0 — built)
- Resubscribe routes through `/paywall` → `goPremium("paid")`, clearing `downgraded`.
- Settings has a "(Demo) restore premium" shortcut for painless live demos — keep it clearly
  marked as a demo affordance.

### 5.6 Entitlement gating (P0)
- One source of truth: `tier` + `downgraded` on `DemoContext`. `isPremium = tier === "trial"
  || tier === "paid"`. Every premium surface derives its locked/unlocked state from this —
  do not scatter ad-hoc tier checks.
- Gated surfaces: For You feed, Deal personalization, Travel Watch, Enrolled Brands, Scout
  assistant's personalized answers.

## 6. Data model

Uses existing types: `Tier` (`"free" | "trial" | "paid"`), `Trial` (`lengthDays`, `dayOfTrial`,
`annualPrice`, `monthlyEquivalent`, …). Lifecycle state (`tier`, `downgraded`) already lives on
`DemoContext` and persists to `dealfinder.demo.v1`. No new types for the prototype.

For the real app, anticipate an `Entitlement` record (plan, status, trialEndsAt,
renewsAt, source) behind the entitlement service (§7).

## 7. Real webapp (forward-looking)

- **Entitlement service** (`WEBAPP_MIGRATION_BUILD_PLAN.md` Phase 5): server-owned
  entitlement gates scan/enroll/personalization/brands/watch. Trial expiry **automatically**
  triggers the graceful downgrade and **pauses scanning** (not just a UI flag).
- **Billing**: Stripe (web) wired to entitlements (Phase 6). Subscribe becomes a real
  checkout; cancel hits Stripe; webhooks reconcile entitlement state. The prototype's
  `goPremium`/`downgrade` map to entitlement transitions.
- The frontend keeps reading a single `isPremium`/`tier` derived from the entitlement
  response — the UX and gating logic don't change, only the source of truth.
- Trial expiry should fire a **pre-expiry reminder** (notification/email) linking to the
  paywall — the real analog of the in-feed trial chip.
- Pricing/packaging is governed by `DealFinder_Financial_Model.xlsx`; keep `annualPrice` etc.
  as config, not hardcoded.

## 8. States to build (checklist for Cowork)

- Paywall: recap reflects live savings; benefits + price; subscribe vs maybe-later; (real)
  checkout-in-progress + payment-error.
- Subscribed: confirmation; deep-link safety (only reachable as paid).
- Downgrade: banner present; all premium surfaces show locked states; resubscribe works.
- Lifecycle round-trip: free → trial → paid → cancel → downgraded → resubscribe → paid, with
  state surviving reload.
- Demo: tier switcher / restore-premium available for live demos (see `DemoMenu`).

## 9. Success metrics

- **Trial → paid conversion** (the headline business metric).
- Paywall view → subscribe rate; effect of higher recap savings on conversion.
- Downgrade → resubscribe rate (the §4.3 payoff) and time-to-resubscribe.
- Voluntary churn (cancel) rate; reactivation rate.

## 10. Open questions

- Does the paywall recap show **trial-period** savings or **lifetime** savings? (Recommend
  trial-period at the trial-end paywall; see `SAVINGS_PRD.md` open questions.)
- Monthly plan option, or annual-only (current)? Financial model dependent.
- On downgrade, how long do we retain scanned data before purge — immediately, or a grace
  window so resubscribing restores instantly? (Privacy vs. convenience trade-off; ties to
  `SETTINGS_PRIVACY_PRD.md` deletion.)
- Should cancel offer a "pause instead of cancel" option, or does that edge toward a dark
  pattern? (Lean: keep cancel clean; no save-offer friction.)
