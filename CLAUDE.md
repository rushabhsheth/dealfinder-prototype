# CLAUDE.md — DealFinder Prototype

Standing instructions for Claude Code. Read this before every task.

## What we're building
A **clickable web prototype** of DealFinder, an AI savings agent. The full product
is a native iOS/Android freemium app (see `DealFinder_PRD.docx`). For now we are
**only** building a web prototype to test flows and look-and-feel — not the real app.

Goal of the prototype: make the **personalized ranked deal feed**, a **deal detail +
one-tap redeem**, and the **trial → paywall** moment feel real and demo-able.

## Hard rules
1. **Mock data only.** No real Gmail/Outlook OAuth, no real email scanning, no real
   billing. All deals, offers, and "scan results" come from local JSON in `app/src/data`.
   Where a real integration would happen (connect inbox, subscribe), build a
   **convincing mocked screen** that advances the flow — do not wire a backend.
2. **No backend in the prototype.** Everything runs client-side. State lives in React
   state / a simple store. Persisting to `localStorage` is fine for demo continuity.
3. **Mobile-first.** Design for a phone viewport (~390px wide). It's a web prototype
   of a mobile app — frame it in a phone-sized container on desktop.
4. **Follow `DESIGN_SYSTEM.md` exactly** for color, type, spacing, and components.
   Use the CSS variables / tokens defined there; don't hardcode hex values in
   components.
5. **Build the screens in `SCREENS.md`**, following the flow order. Don't invent extra
   screens without asking.
6. **Trust is the brand.** Ranking is never influenced by payout. Never add UI that
   implies "sponsored" deals rank higher. The vibe is calm and credible, not a loud
   coupon site.

## Tech stack
- **React + Vite + TypeScript**
- **Tailwind CSS** for styling, with design tokens from `plans/DESIGN_SYSTEM.md` mapped
  into the Tailwind theme (`app/tailwind.config.ts`).
- Routing: `react-router` for screen-to-screen navigation.
- Icons: `lucide-react`.
- No state library needed; React context + hooks is enough.

## Repo layout
- `app/` — the Vite + React web prototype (run all `npm` commands from here).
- `plans/` — `BUILD_PLAN.md`, `DESIGN_SYSTEM.md`, `SCREENS.md`.
- `PRDs/` — source requirements (`DealFinder_PRD.docx`, models, catalogs).
- `CLAUDE.md` — this file, at the repo root.

## Project conventions
- Components in `app/src/components`, screens in `app/src/screens`, mock data in
  `app/src/data`.
- One screen per file, named to match `plans/SCREENS.md` (e.g. `RankedFeed.tsx`).
- Keep components presentational; mock data is imported, never fetched.
- Reusable pieces: `DealCard`, `SavingsBadge`, `UrgencyBadge`, `PhoneFrame`,
  `PrimaryButton`, `BottomNav`.
- Money always formatted as USD. Show savings as both `$` and `%` where the PRD
  journeys imply it.

## Explicitly OUT of scope for the prototype
- Real email OAuth / inbox reading / extraction pipeline
- Real subscription billing (App/Play Store IAP)
- CASA / Google restricted-scope verification work
- Auto-enrollment that actually sends signups
- Travel fare APIs (mock the watch + alert)
- Account system / real auth

## Where to look
- `PRDs/DealFinder_PRD.docx` — full product requirements (source of truth for behavior)
- `plans/DESIGN_SYSTEM.md` — visual language
- `plans/SCREENS.md` — the screens to build and their flow
- `plans/BUILD_PLAN.md` — what to build in what order
