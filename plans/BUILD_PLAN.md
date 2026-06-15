# DealFinder — Prototype Build Plan

A scoped, phased plan for the **web prototype**. The aim is a clickable demo that proves
the look and the core flow — not a production app. Work top to bottom; each phase should
end in something runnable and demo-able.

## Guiding principle
Build the **value moments** first (personalized feed, deal detail, "we found you $X",
paywall). These retire the riskiest product question — is the experience compelling
enough to pay for? — before spending time on onboarding plumbing.

---

## Phase 0 — Scaffold (foundation)
- Vite + React + TypeScript + Tailwind project.
- Map `DESIGN_SYSTEM.md` tokens into `tailwind.config` (colors, type scale, radius).
- Build shared primitives: `PhoneFrame`, `PrimaryButton`, `SavingsBadge`,
  `UrgencyBadge`, `DealCard`, `BottomNav`.
- Create `/src/data` with mock JSON: `deals.json` (public + personalized),
  `savings.json`, `watches.json`. ~15–20 realistic deals across retail + travel.
- Routing skeleton with all screens stubbed.
- **Done when:** app runs, phone frame renders, a `DealCard` shows real mock data.

## Phase 1 — Hero experience (the demo core)
- **Screen 9 — Personalized Ranked Feed** with real ranking-feel ordering of mock deals.
- **Screen 10 — Deal Detail + one-tap Redeem** (copy code + toast).
- **Screen 8 — Savings Summary** "Here's what we found you".
- **Screen 13 — Paywall / Trial Recap.**
- **Done when:** you can open the app at the personalized feed, tap into a deal, redeem,
  and hit the paywall. This alone is a sellable demo.

## Phase 2 — Premium onboarding flow
- **Screen 3 — Trial Intro** → **4 — Interest Survey** → **5 — Connect Email
  (mocked PermissionSheet)** → **6 — Enrollment Consent** → **7 — First Scan reveal** →
  lands on Screen 8.
- Wire the full premium path end to end with mock data driving the "scan".
- **Done when:** "Start trial" runs the whole chain into the personalized feed.

## Phase 3 — Free tier & lifecycle
- **Screen 1 — Value Explainer**, **2 — Free Open-Deals Feed** with upsell banner.
- **Screen 14 — Downgraded Free Tier** (post-trial, premium paused, resubscribe path).
- Tie the entitlement toggle (trial / paid / free) to a simple demo state so you can
  flip between tiers to show the downgrade.
- **Done when:** both demo paths (free and premium) are walkable, plus the downgrade.

## Phase 4 — Supporting screens
- **Screen 11 — Travel Watch** (mocked fare-drop alert).
- **Screen 12 — Savings Dashboard** (cumulative savings).
- **Screen 15 — Settings & Privacy Controls.**
- **Done when:** nav is complete and trust controls are visible.

## Phase 5 — Polish
- Transitions, the scan animation, empty/loading states, toasts.
- A "demo control" (hidden menu) to jump to any screen and switch tier — makes live
  demos painless.
- Pass over copy for the calm, trustworthy tone.

---

## Out of scope (do NOT build in the prototype)
- Real Gmail/Outlook OAuth or any inbox reading
- Real email extraction / classification pipeline
- Real billing / App Store / Play Store IAP
- CASA / Google restricted-scope verification
- Auto-enrollment that actually subscribes to anything
- Live travel fare data
- Backend, database, or auth system

## Suggested first prompt to Claude Code
> Read CLAUDE.md, DESIGN_SYSTEM.md, SCREENS.md, and BUILD_PLAN.md. Do Phase 0: scaffold
> the Vite + React + TS + Tailwind project, map the design tokens, build the shared
> components, and create the mock data files. Then show me the Personalized Ranked Feed
> (Screen 9) with mock deals so I can see the look.
