# Sub-PRD — Savings & Proof of Value

Companion to `PRDs/DealFinder_PRD.docx` (§4.2 Value reveal, §4.4 Retention). Sibling to
`plans/CORE_FEED_PRD.md` (redeem produces savings) and `plans/MONETIZATION_PRD.md` (the
paywall recaps savings). This sub-PRD scopes the **two screens that quantify value**: the
post-scan **Savings Summary** ("We found you $X") and the cumulative **Savings Dashboard**
(the retention hook), plus the **savings/redemption ledger** that feeds both and the paywall.

It covers both layers:
- **Prototype** (now) — mock `savings.json`, redeemed deals tracked in `DemoContext`.
- **Real webapp** — a persisted savings ledger computed from real redemptions/offers.

> **Concrete, always (DESIGN_SYSTEM.md).** Savings are shown as real dollars, real %, real
> dates. Savings numbers always render in `--savings-600` (green = money). No vanity inflation
> — the number has to be defensible, because it's the basis of the paywall ask.

> **Two numbers, on purpose.** We track and show **both** *surfaced value* (the total value
> of every offer Scout put in front of you) and *redeemed value* (what you actually acted on),
> plus the **gap** between them. The gap is framed as **opportunity still available**, never as
> guilt ("you missed $X"). Redeemed is the honest, headline "money saved"; surfaced shows the
> agent is working; the gap is a gentle nudge to act.

---

## 1. Problem & why now

DealFinder's pitch is "we save you money." That claim has to be **shown, twice**: once
immediately after the scan (the "magic moment" payoff that justifies connecting the inbox),
and continuously over time (the reason to keep paying). If the savings story is vague or
feels made-up, the trial doesn't convert and paid users churn.

Both screens are built (`SavingsSummary.tsx`, `SavingsDashboard.tsx`) off mock `savings.json`,
and redemptions are tracked in `DemoContext` (`redeemedIds`). But the *relationship* between
"a deal I redeemed" and "my total saved" is currently loose — the dashboard reads static mock
totals rather than summing actual redemptions. This sub-PRD defines the ledger so the savings
story is internally consistent (redeem a deal → it shows in recent redemptions → it adds to
the total → the paywall recaps it).

## 2. Goals & non-goals

**Goals**

- Deliver an immediate, concrete **post-scan reveal** that makes connecting the inbox feel
  worth it (the §8 trial-conversion driver).
- Give a **cumulative savings dashboard** that reinforces ongoing value: total saved, trend
  over time, redeemed count, by-category breakdown, recent redemptions.
- Track and present **two distinct figures — surfaced value and redeemed value — plus the
  gap**, so the user sees both how hard the agent is working and how much they've banked.
- Define a single **savings ledger** so redeem → summary → dashboard → paywall all agree.
- Keep every figure **traceable** to a deal/redemption (no opaque totals).

**Non-goals**

- No real spend/transaction tracking (we never see bank/card data — savings are estimated
  from offer value, not verified purchases).
- Not the redeem interaction itself — that's `CORE_FEED_PRD.md`. This PRD consumes
  redemptions; it doesn't define the button.
- Not the paywall — `MONETIZATION_PRD.md` owns conversion; it just *reads* `cumulative`.

## 3. Surfaces in this PRD

| # | Surface | Route | File | State |
|---|---|---|---|---|
| 8 | Savings Summary ("We found you $X") | `/summary` | `screens/SavingsSummary.tsx` | Built |
| 12 | Savings Dashboard | `/savings` | `screens/SavingsDashboard.tsx` | Built |
| — | Savings ledger / model | (data) | `data/savings.json`, `lib/data.ts`, `DemoContext` | Built (static) |

## 4. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 4.0 The two metrics (definitions) (P0 — new)
- **Surfaced value** — the summed estimated value of **every offer Scout surfaced** to the
  user (the deals in the feed / found in the scan), whether or not they acted. Proof the agent
  is working; the bigger, softer number.
- **Redeemed value** — the summed value of offers the user **actually redeemed** (copy
  code / book / open). The honest "money you saved"; the smaller, defensible headline number.
- **Available / unrealized** = `surfaced − redeemed`. Framed positively: "$X in deals still
  waiting for you," never "$X missed." Optionally time-bounded ("still live" = sum of
  unredeemed, **unexpired** offers) so we never nudge toward dead deals.
- Headline hierarchy: **redeemed is the hero number**; surfaced and available are secondary
  context. We are an honest savings tracker first, an activity meter second.

### 4.1 Savings Summary — the reveal (P0 — built)
- Apricot-tinted hero (a spotlight moment — one of the few apricot uses, per design system):
  badge "Your first scan is done", "We found you", big display **`$foundTotal`** in savings
  green, then "across N offers — from M messages scanned".
- Animated entrance (`fade-up`) on the number and supporting lines — the number should *land*.
- **Top picks**: the `firstScan.topDealIds` rendered as compact `DealCard`s, linking into
  Deal Detail.
- Calm reassurance: "We'll keep scanning and only ping you when something's worth it."
- Single sticky CTA: **"See my feed"** → `/feed`.
- Reached only from `/scan` in the happy path (`ONBOARDING_PRD.md`).
- **Note:** `firstScan.foundTotal` here *is* the initial **surfaced value** — "found you $X"
  is the surfaced number at scan time. Nothing is redeemed yet, so the summary shows surfaced
  only (no gap to display until the user starts redeeming).

### 4.2 Savings Dashboard — the retention hook (P0 — built + extend)
- **Hero total: redeemed value** — "Saved with DealFinder" + big `cumulative.totalSaved`
  (= redeemed) in green + a **sparkline** of `cumulative.timeline` (cumulative area chart, SVG,
  no chart lib). Redeemed stays the hero — the honest headline.
- **Surfaced vs. redeemed comparison (NEW)** — directly under/beside the hero, show the second
  number and the gap. Two viable treatments:
  - a **dual stat** ("$1,240 surfaced · $420 redeemed") with a thin proportional bar showing
    redeemed as a fraction of surfaced, or
  - a small "**$820 in deals still waiting**" line (the available gap) with a CTA back to the
    feed.
  Redeemed is visually dominant; surfaced/available are secondary. Keep the positive framing
  from §4.0 — no guilt.
- Stat cards: **Deals redeemed** (`dealsRedeemed`) and **Avg. saving %**
  (`averageSavingPercent`). Consider a third: **offers surfaced** count.
- **By category** bars: `byCategory` with proportional fill bars in savings green. (P1: show
  surfaced vs. redeemed per category as a stacked/overlaid bar so the user sees where they're
  leaving value on the table.)
- **Recently redeemed** list (newest first): brand, date, `$` saved per redemption → each
  taps into `/deal/:id`.
- Reached via bottom nav (Savings tab).

### 4.3 Savings ledger consistency (P1 — improve)
- **Today the dashboard reads static mock totals**; redeeming a deal in the prototype updates
  `redeemedIds` but not the displayed `cumulative`/`redeemed`. Close this gap so the demo is
  coherent, and compute **both** metrics:
  - **Redeemed value** = sum of `Deal.savingsAmount` over `redeemedIds`, layered over seed
    redemptions. Drives `totalSaved`, `dealsRedeemed`, and the "Recently redeemed" list.
  - **Surfaced value** = sum of `Deal.savingsAmount` over all surfaced deals
    (`personalizedDeals`, plus the seed `firstScan.foundTotal` baseline). Drives the surfaced
    figure and the available gap (`surfaced − redeemed`).
  - The paywall's recap (`MONETIZATION_PRD.md`) reads the **same** redeemed `totalSaved`, so
    redeeming during the trial visibly grows the paywall number; it may also cite surfaced as
    the softer "Scout found you $X overall" line.
- Keep the seed mock data so a fresh demo still shows a populated dashboard, but let in-session
  redemptions move value from "available" into "redeemed." (Implementation: a selector in
  `lib/data.ts` — e.g. `getSavings(redeemedIds)` — that returns `{ surfaced, redeemed,
  available, ...cumulative }` merging seed + live `redeemedIds`.)

### 4.4 Trust & honesty (P0)
- Savings are framed as **estimated value of offers**, not verified spend — avoid implying we
  track purchases. A small caption clarifying "estimated savings from offers we surfaced" is
  acceptable and more credible than a bare number.
- Never inflate: `foundTotal`, surfaced, and redeemed should be defensible sums of real offer
  values.
- **Surfaced ≠ saved.** The UI must make clear that surfaced value is *available/found*, not
  money in the bank — only **redeemed** is "saved." Keep redeemed visually dominant and label
  surfaced honestly so the bigger number never reads as a misleading "you saved $X" claim.
- The gap is **opportunity, framed warmly** ("still waiting for you"), never a guilt/loss
  message ("you wasted $X"). This follows the brand's calm, supportive tone.

## 5. Data model

Uses the existing `SavingsData` type (`app/src/types.ts`): `trial`, `firstScan`,
`cumulative { totalSaved, dealsRedeemed, averageSavingPercent, byCategory[], timeline[] }`,
`redeemed[]`. `cumulative.totalSaved` is the **redeemed** figure.

To add surfaced value, extend `cumulative` (small, additive — backward-compatible since
`load()` spreads defaults):

```ts
// app/src/types.ts — additive fields on SavingsData["cumulative"]
interface CumulativeSavings {
  totalSaved: number;            // REDEEMED value (existing; the headline)
  surfacedValue: number;         // NEW — total value of all surfaced offers
  availableValue: number;        // NEW — surfaced − redeemed, of still-live offers
  dealsRedeemed: number;
  offersSurfaced: number;        // NEW — count of surfaced offers (optional)
  averageSavingPercent: number;
  byCategory: CategorySaving[];  // P1: split surfaced vs redeemed per category
  timeline: TimelinePoint[];
}
```

Prefer a derived selector over hand-maintaining both, so live redemptions stay consistent:

```ts
// lib/data.ts (sketch) — merge seed + in-session redemptions into both metrics
export function getSavings(redeemedIds: string[]): {
  surfaced: number; redeemed: number; available: number;
  cumulative: SavingsData["cumulative"];
} { … }
```

`RedeemedDeal { dealId, brand, saved, redeemedAt }` already exists for the recent list.

## 6. Real webapp (forward-looking)

- The ledger becomes a **persisted, server-computed record** per user: each surfaced offer has
  an estimated value (→ **surfaced value**); each redemption (copy/book/open event) writes a
  `savings` row (→ **redeemed value**); totals, the gap, and the timeline are aggregated
  server-side behind `GET /me/savings`, returning both metrics.
- **Available value** should exclude expired offers server-side, so "still waiting for you"
  always points at live deals — the nudge never sends users toward dead links.
- `firstScan` (summary) is driven by **real extraction output** (Phase 2,
  `GMAIL_KICKOFF.md`): the actual count of messages scanned, offers found, and their summed
  value. The "We found you $X" number must be a real sum, conservatively estimated.
- Savings estimation methodology should be documented (e.g. `savingsAmount = originalPrice −
  dealPrice`, or `originalPrice × savingsPercent`), since it underpins the paywall claim and
  any marketing.
- By-category and timeline come from real redemption history; the sparkline stays a simple
  inline SVG (no heavy chart dependency).
- Privacy: savings are derived from offer metadata, not raw email or financial data —
  in-scope for the OAuth justification, no extra sensitive scopes.

## 7. States to build (checklist for Cowork)

- Summary: hero animates; top-picks present; (edge) zero-found state — "We didn't find much
  this time, but we'll keep scanning" (must not feel like failure).
- Dashboard: populated; **after redeeming a deal, redeemed grows and available shrinks** (the
  value moves between the two metrics) (§4.3); surfaced-vs-redeemed comparison renders; recent
  list reflects redemptions; empty-history state for a brand-new account; (real) loading +
  error/retry.
- Edge: redeemed = 0 (all surfaced, none acted) — show the available nudge, not an empty/sad
  state. Redeemed = surfaced (acted on everything) — celebrate; hide or zero-out the gap line.
- Both: figures consistent with each other and with the paywall recap (redeemed = headline).

## 8. Success metrics

- Summary reveal → "See my feed" continuation; summary view → trial-day-1 retention.
- Dashboard visits per active user per week (retention proxy).
- Correlation between cumulative savings shown and trial→paid conversion.
- Redeem→dashboard reflection latency (should feel instant in the prototype).

## 9. Open questions

- ~~Should the dashboard total count all surfaced or only redeemed?~~ **Resolved: show both.**
  Redeemed is the honest headline ("money you saved"); surfaced is the softer "Scout found you
  $X"; the gap ("still waiting for you") is a warm nudge (§4.0, §4.2, §4.4).
- Available gap: count **all** unredeemed surfaced value, or only **still-live** (unexpired)
  offers? (Recommend still-live, so we never nudge toward dead deals — §4.0, §6.)
- Surfaced metric over what window — lifetime, or a rolling period (e.g. last 90 days)? A
  lifetime surfaced number could balloon and dilute the redeemed headline. (Recommend lifetime
  redeemed + rolling-window or "currently live" surfaced.)
- Per-category surfaced-vs-redeemed (P1) — worth the stacked-bar complexity, or keep category
  bars redeemed-only? 
- Lifetime vs. trial-period framing on the paywall recap — does the paywall show trial-only
  savings while the dashboard shows lifetime?
- Do we show projected annual savings ("on track to save $X/yr") as a conversion lever, or
  does projection undercut the "concrete, defensible" principle?
