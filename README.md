# DealFinder — Web Prototype

A clickable, mobile-first web prototype of DealFinder (an AI savings agent).
**Mock data only, no backend** — see `CLAUDE.md` for the rules of the road.

## Repo layout

```
prototype/  the Vite + React web prototype  (run npm commands here)
plans/    BUILD_PLAN.md · DESIGN_SYSTEM.md · SCREENS.md
PRDs/     source requirements (PRD, financial model, services catalog)
CLAUDE.md standing build instructions (repo root)
```

## Run it

```bash
cd prototype
npm install
npm run dev      # → http://localhost:5173
```

`npm run build` type-checks and produces a production bundle in `dist/`.

The app renders inside a phone frame (~390×844) on desktop, and full-bleed on a
real phone.

## Demo paths

Two ways through the prototype (per `SCREENS.md`):

- **Free path:** Value Explainer (`/`) → Free Open-Deals Feed (`/free`) → upsell.
- **Premium path:** Trial Intro (`/trial`) → Survey → Connect Email → Enrollment
  → First Scan → **"We found you $214"** (`/summary`) → Ranked Feed (`/feed`) →
  Deal Detail (`/deal/:id`) → Paywall (`/paywall`).

### Demo controls
Tap the **✦ wand button** (bottom-right of the phone) to open a hidden presenter
menu: jump to any screen and flip the entitlement tier (free / trial / paid) to
show the downgrade. "Reset" clears demo state.

## App structure

```
prototype/src/
  components/   PhoneFrame, DealCard, SavingsBadge, UrgencyBadge, BottomNav,
                PrimaryButton, TopBar, Toast, DemoMenu, …
  screens/      One file per screen in plans/SCREENS.md (RankedFeed, DealDetail, …)
  data/         Mock JSON — deals, savings, watches (imported, never fetched)
  lib/          data accessors + money/date formatting
  state/        DemoContext — tier + redeemed deals (persisted to localStorage)
```

Design tokens (the "Sunset Tide" palette + type scale) live in
`prototype/tailwind.config.ts` and `prototype/src/index.css`; components use named tokens
(`bg-primary`, `text-savings`, …) rather than raw hex.

## Notable behavior
- **Ranking is payout-blind.** The personalized feed sorts purely by a relevance
  score; nothing implies a deal is sponsored or boosted.
- The demo's "today" is **2026-06-15**; expiry/urgency copy is computed from it.
- One-tap **Redeem** copies the promo code and fires a confirmation toast.
