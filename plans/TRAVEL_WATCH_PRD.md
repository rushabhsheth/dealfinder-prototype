# Sub-PRD — Travel Watch ("Flight Fare Deals")

Companion to `PRDs/DealFinder_PRD.docx` (§4.2 Travel watches, §5.6 Fare alerts). Sibling to
`plans/CORE_FEED_PRD.md` (alerts deep-link into Deal Detail) and `plans/USER_PREFERENCES_PRD.md`
(home airport seeds the origin). This sub-PRD scopes the **travel fare-watch surface**: setting
a route + target price, and the active-watch cards including the fare-drop **alert** state.

It covers both layers:
- **Prototype** (now) — mocked fares and a seeded alert; no live fare data.
- **Real webapp** — forward-looking notes on real fare data (explicitly a *later* phase).

> **Scope reality (CLAUDE.md / migration plan).** Live travel fare APIs and auto-booking are
> **out of scope** for the prototype and the first webapp slice. We mock the *watch + alert*
> experience convincingly; we do not fetch real fares yet. Premium-gated.

---

## 1. Problem & why now

Travel is one of the three premium pillars and the most emotionally compelling savings story
(a $120 fare drop feels great). The watch is also a **retention engine**: once a user sets a
watch, they have a standing reason to come back and a reason to keep paying. The screen exists
(`TravelWatch.tsx`, titled "Flight Fare Deals") with a working add-watch form and a seeded
alert card, but its behavior contract, states, and the path to real fares aren't written down.
This sub-PRD captures that so Cowork can polish the mock and the real app can slot fares in
behind the same UI.

## 2. Goals & non-goals

**Goals**

- Let a premium user **set a route watch** (origin, destination, target price) in a few taps,
  with the home airport pre-filling origin.
- Show **active watches** with current vs. target fare, lowest-seen, and a clear distinction
  between "watching" and a fired **alert**.
- Make the **alert** feel like a real win: a fare-below-target card that deep-links to a
  bookable deal (mocked) — the payoff moment.
- Structure fares behind a seam so **real fare data drops in later** without UI changes.

**Non-goals**

- No live fare APIs, no real price polling, no auto-booking (CLAUDE.md out-of-scope; migration
  plan: "travel watch stays mocked until a fares phase").
- Not the booking flow itself — the alert routes to Deal Detail (`CORE_FEED_PRD.md`), which
  mocks "Book this rate."
- No multi-leg / multi-passenger / hotel watches in v1 (one-way origin→dest target only).

## 3. Surface

| # | Surface | Route | File | State |
|---|---|---|---|---|
| 11 | Travel Watch ("Flight Fare Deals") | `/watches` | `screens/TravelWatch.tsx` | Built |

Reached via bottom nav. Premium-gated (see `MONETIZATION_PRD.md` entitlement model).

## 4. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 4.1 Add a watch (P0 — built)
- Inputs: origin (3-letter, defaults to home airport — currently hardcoded "SFO"; **wire to
  `preferences.homeAirport`**), destination (3-letter), target price ($, numeric, ≤4 digits).
- "Add watch" disabled until all three present; on add, prepend a new `watching` watch with a
  plausibly-above-target `currentPrice` (mock), clear the inputs.
- Header reassurance: "We'll only ping you when a fare drops below your target" (the calm,
  non-spammy promise from the design system).

### 4.2 Active watch cards (P0 — built)
- Each card: origin ✈ destination, city subline, current fare (large), target fare, and:
  - **Watching** state: "Watching" pill + "Lowest seen $X · $Y above target".
  - **Alert** state: savings-tinted card, "Alert" pill, the `alertMessage`, and a CTA that
    deep-links to `linkedDealId` → `/deal/:id` ("Book this rate", mocked).
- One seeded watch ships in the **alert** state so the demo shows the payoff immediately.

### 4.3 Home-airport integration (P1)
- Origin should pre-fill from `preferences.homeAirport` (set in onboarding / Settings), not a
  hardcoded "SFO". Small change, real personalization payoff, ties the surfaces together.

### 4.4 Manage watches (P1)
- Delete/cancel a watch (swipe or trailing action). Edit target price. Pause a watch.
- Persist user-created watches for demo continuity (currently in-component `useState` only —
  consider lifting to `DemoContext` like `redeemedIds`, behind localStorage).

### 4.5 Entitlement (P0)
- Premium-only. Free/downgraded users see a locked state ("Fare watches are a premium
  feature") consistent with the downgrade pattern (`MONETIZATION_PRD.md`).

## 5. Data model

Uses the existing `Watch` type (`app/src/types.ts`): `origin/destination` (+ city),
`targetPrice`, `currentPrice`, `lowestSeen`, `status` (`"watching" | "alert"`),
`alertMessage`, `linkedDealId`, `createdAt`. Seed data in `data/watches.json`.

For §4.4 persistence, prefer lifting created/edited watches into `DemoContext` (mirrored to
`dealfinder.demo.v1`) rather than expanding the JSON, so user-created watches survive reload.

## 6. Real webapp (forward-looking — explicitly a later phase)

- A **fares phase** (after the Gmail slice; `WEBAPP_MIGRATION_BUILD_PLAN.md` out-of-scope for
  the first migration) introduces a real fare data source behind a `FareProvider` interface:
  `getFare(origin, dest, dates) → price`. The card UI stays identical.
- Watches become persisted records (`GET/POST/DELETE /me/watches`) with a background poller
  that compares current fare to target and **fires an alert** (notification + the alert-state
  card) when it drops below — the real analog of the seeded alert.
- The alert's "Book this rate" links to a real fare/booking deep link (still **no
  auto-booking** — the user books). City names resolve from an airport reference table.
- Notifications respect the Settings "Fare-drop alerts" toggle (`SETTINGS_PRIVACY_PRD.md`).
- Cost/rate-limit awareness: fare polling is expensive — design for batched, throttled checks,
  not per-watch real-time polling.

## 7. States to build (checklist for Cowork)

- Add form: empty/partial/complete; invalid airport handling (prototype: free-text 3 letters).
- Watch card: watching, alert, just-added (optimistic).
- Empty state: no watches yet ("Watch a route and we'll catch the drops").
- Locked state: free/downgraded user.
- (Real) loading fares, fare-fetch error, alert-fired.

## 8. Success metrics

- Watches created per premium user; % of users with ≥1 active watch (retention proxy).
- Alert → Deal Detail → "book" tap-through (the payoff funnel).
- Return-visit rate among users with active watches vs. without.
- (Real) alert precision — fares that were actually bookable at the alerted price.

## 9. Open questions

- Date flexibility: fixed dates, a month window, or "anytime"? (Prototype ignores dates;
  real fares need them.) Recommend a simple "flexible / specific month" toggle in v1-real.
- Round-trip vs one-way (current model is one-way origin→dest). Round-trip doubles the
  matching complexity — defer?
- Should watches also live in the feed (a fare-drop showing up as a `DealCard`), or stay
  siloed on the Watches tab? (Cross-surface alert could lift engagement.)
- How aggressive is "below target" — exact threshold, or also "within 5% / new low"? Affects
  alert frequency and the no-spam promise.
