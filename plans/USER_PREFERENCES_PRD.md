# Sub-PRD — User Preferences ("About You")

Companion to `PRDs/DealFinder_PRD.docx` (§4.2 Personalization, §5.x Interest survey) and a
sibling to `plans/ENROLLED_BRANDS_PRD.md`. This sub-PRD scopes **where the personalization
inputs collected in the Interest Survey are stored, and how the user edits them later.**

It covers both layers:
- **Prototype** (the web mock we are building now) — client-side state, no backend.
- **Real webapp** — a persisted user-preferences record (forward-looking note).

> **Name.** Shown to users as **"About you"** during onboarding (the Interest Survey
> header) and as a **"Preferences"** section inside Settings & Privacy. Same underlying
> data, two entry points.

---

## 1. Problem & why now

The Interest Survey (`app/src/screens/InterestSurvey.tsx`, "About you", Step 1 of 3)
collects four personalization inputs: **shopping categories**, **favorite brands**, **home
airport**, and **travel style**. These are the seed signals for the personalized ranked
feed and for which brands the agent auto-enrolls.

**Today the prototype throws all of it away.** The four inputs live in local component
`useState`, and both **Continue** and **Skip for now** call `navigate("/connect")` without
persisting anything. Nothing downstream reads them, and there is no screen to view or change
them afterward — `Settings.tsx` has subscription, inbox, notification, and data controls,
but no preferences section. So the answer to *"where are these saved so I can update them
later?"* is currently **nowhere**.

This is both a demo gap (the feed can't visibly reflect what the user just picked) and a
trust/control gap (the brand is "you're in control" — the user must be able to revisit and
revise what they told us).

## 2. Goals & non-goals

**Goals**

- Persist the four Interest Survey inputs to a single source of truth so they survive
  navigation and app reloads (demo continuity).
- Make the same data **editable later** from a dedicated **Preferences** surface in Settings,
  reusing the existing chip/segment components from the survey.
- Keep the storage shape clean enough that the real backend can adopt it as-is
  (a `/me/preferences` record) without reshaping the frontend.

**Non-goals**

- No real account system or auth (out of scope per `CLAUDE.md`).
- No server, no real personalization model — the feed may *read* preferences, but ranking
  logic stays mock/heuristic in the prototype.
- Not the place to manage which brands are enrolled/unsubscribed — that's the **Enrolled
  Brands** sub-PRD. Preferences seeds enrollment; it doesn't manage the resulting senders.
  (Cross-link: editing favorite brands here may *suggest* enrollment changes there.)

## 3. Where preferences are stored

### 3.1 Prototype (now)

Single source of truth: **`app/src/state/DemoContext.tsx`**, the same store that already
holds `tier`, `downgraded`, and `redeemedIds` and mirrors them to `localStorage` under the
key **`dealfinder.demo.v1`**.

Add a `preferences` object to the persisted state and the same `useEffect` that already
writes the store, so it is saved on every change and rehydrated by `load()` on app open.
Nothing new infrastructurally — preferences ride the existing persistence path.

```ts
// app/src/types.ts
export type TravelStyle = "budget" | "comfort" | "luxury";

export interface UserPreferences {
  categories: string[];   // e.g. ["Travel", "Retail"] — survey category labels
  brands: string[];       // e.g. ["Delta", "Patagonia"] — favorite-brand labels
  homeAirport: string;    // 3-letter IATA, uppercased, e.g. "EWR"
  travelStyle: TravelStyle;
}
```

```ts
// app/src/state/DemoContext.tsx — additions
interface Persisted {
  tier: Tier;
  downgraded: boolean;
  redeemedIds: string[];
  preferences: UserPreferences;        // NEW
}

const DEFAULT_PREFERENCES: UserPreferences = {
  categories: [],
  brands: [],
  homeAirport: "",
  travelStyle: "comfort",
};

// exposed on the context:
//   preferences: UserPreferences;
//   setPreferences: (patch: Partial<UserPreferences>) => void;
// merged into the existing localStorage useEffect and reset().
```

Notes:
- `load()` already spreads defaults then the parsed value, so adding `preferences` is
  backward-compatible with existing saved state (missing key falls back to defaults).
- `reset()` (the demo reset) should also restore `DEFAULT_PREFERENCES`.
- Persisting personal-ish data (home airport) to `localStorage` is acceptable for the demo
  per `CLAUDE.md`; it never leaves the browser.

### 3.2 Real webapp (forward-looking)

In the real app this object becomes a per-user **`UserPreferences`** record behind a
`GET/PUT /me/preferences` endpoint, read on session start and written on save. The frontend
type above is the contract; the store swaps its `localStorage` mirror for the API call. No
component changes required beyond the data source. CASA/privacy: preferences are
user-supplied profile data, not inbox content — outside restricted scopes.

## 4. Read & write surfaces

| Surface | Role | File |
|---|---|---|
| Interest Survey ("About you") | **Write** — seeds initial values; Continue saves, Skip leaves defaults | `app/src/screens/InterestSurvey.tsx` |
| Settings → Preferences (NEW) | **Read + write** — view and edit anytime | `app/src/screens/Settings.tsx` |
| Personalized feed | **Read** — may reflect categories/brands/airport in ordering & copy | `app/src/screens/Feed.tsx`, `app/src/lib/data.ts` |

## 5. Functional requirements

P0 = prototype must-have, P1 = fast-follow.

### 5.1 Persist survey inputs (P0)
- `InterestSurvey` initializes its local state from `preferences` (so revisiting onboarding
  shows prior choices), and on **Continue** calls `setPreferences({...})` with all four
  values before navigating to `/connect`.
- **Skip for now** navigates without writing — defaults (or any previously saved values)
  stand. No empty object is forced over existing data.

### 5.2 Preferences section in Settings (P0)
- New **"Preferences"** group in `Settings.tsx` (above or below "Inbox & privacy"), with
  rows for the four inputs, editable in place using the **same components as the survey**:
  category chips, brand chips, the airport text input, and the travel-style segmented
  control. Refactor the survey's `ChipGroup` / segmented control into shared components
  (e.g. `app/src/components/ChipGroup.tsx`) so both screens render identical controls.
- Edits write through `setPreferences` immediately (optimistic, localStorage-backed); show a
  light "Saved" toast via the existing `useToast`.

### 5.3 Feed reflects preferences (P1)
- The ranked feed reads `preferences` to bias ordering/labels (e.g. surface picked
  categories first, tag a deal "Because you follow Patagonia"). Ranking stays mock and is
  **never** influenced by payout (`CLAUDE.md` hard rule).

### 5.4 Sync with Enrolled Brands (P1)
- Favorite brands chosen here are a signal into auto-enrollment. When a brand is added/removed
  in Preferences, reflect it as a suggested enroll/pause in the Enrolled Brands surface — do
  not silently unsubscribe. (Detailed behavior owned by `ENROLLED_BRANDS_PRD.md`.)

## 6. Data model

See §3.1 — `UserPreferences` added to `app/src/types.ts`, stored on `DemoContext` and in the
`dealfinder.demo.v1` localStorage blob (prototype) / `/me/preferences` (real app).

## 7. Acceptance criteria (prototype)

- Selecting categories/brands, typing an airport, and choosing a travel style in the survey,
  then continuing, **survives a full page reload** (values rehydrate from localStorage).
- Opening **Settings → Preferences** shows exactly what was chosen in the survey and allows
  editing each field; edits persist across reload.
- **Skip for now** never clears previously saved preferences.
- Demo **reset** returns preferences to defaults.

## 8. Open questions

- Should the survey default to a few pre-selected chips (current behavior hardcodes
  `["Travel","Retail"]` / `["Delta","Patagonia"]` / `SFO` / `Comfort`) or start empty so we
  only store deliberate choices? Recommend: start from saved prefs, empty on first run.
- Home airport: free-text 3-letter input (current) vs. validated picker — keep free-text for
  the prototype, validate in the real app.
- Does the feed visibly change enough in the demo to justify wiring §5.3 now, or defer until
  the personalized feed work lands?
