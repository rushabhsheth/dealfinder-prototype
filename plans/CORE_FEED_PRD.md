# Sub-PRD — Core Deal Experience (Personalized Feed + Deal Detail)

Companion to `PRDs/DealFinder_PRD.docx` (§4.2 Personalized ranking, §6 Deal detail & redeem,
§7 Extraction). Sibling to `plans/USER_PREFERENCES_PRD.md` (personalization inputs) and
`plans/ENROLLED_BRANDS_PRD.md` (offer→brand links). This sub-PRD scopes the **two hero
screens** that carry the demo and the product: the **personalized ranked feed** and the
**deal detail + one-tap redeem**.

It covers both layers:
- **Prototype** (now) — mock JSON, a precomputed `relevanceScore`, placeholder grading.
- **Real webapp** — server-side, payout-blind ranking over real extracted offers.

> **Trust is the brand (CLAUDE.md hard rule 6).** Ranking and grading are **payout-blind** —
> never influenced by any affiliate/commission. No "sponsored ranks higher" UI, ever. Every
> ranked/graded surface carries an explicit line saying so.

---

## 1. Problem & why now

These two screens *are* the product. The personalized feed is the proof that scanning the
inbox was worth it; the deal detail is where saving actually happens (copy code / book /
open). If they feel generic — like any coupon site — the whole "agent that works for you"
thesis collapses. They're also the screens the build plan sequences **first**
(`BUILD_PLAN.md` Phase 1) because they retire the riskiest question: is the experience
compelling enough to pay for?

Both are built in the current prototype (`Feed.tsx` → `ForYou`, `DealDetail.tsx`) with a
real ranking *feel* (sorted by `relevanceScore`), a `DealGrade`, and a working redeem-toast.
This sub-PRD writes down the contract — ranking rules, card anatomy, redeem behavior, trust
framing, and the prototype→real seam — so Cowork can harden and migrate it without eroding
the payout-blind guarantee.

## 2. Goals & non-goals

**Goals**

- Make the **For You** feed feel hand-picked: ranked by genuine value-to-the-user (fit +
  savings + urgency), with a visible "why you're seeing this" rationale on top items.
- Make **Deal Detail** a complete, structured offer with **one-tap action** (copy code,
  book, or open) and a confirmation that reinforces savings.
- Keep ranking/grading logic **isolated** (`lib/data.ts` sort, `lib/grade.ts`) so the real
  model drops in without touching the UI.
- Make the payout-blind promise legible on every relevant surface.

**Non-goals**

- Not the public/free catalog — that's the "All Deals" view in `FREE_PATH_PRD.md` (shares
  the `DealCard`/`DealDetail` components but not the ranking).
- No real extraction pipeline in the prototype (that's `GMAIL_KICKOFF.md` Phase 2).
- No real redemption/affiliate tracking — redeem is a local "saved" state + clipboard copy.
- Not savings accounting — redeemed totals and history live in `SAVINGS_PRD.md`.

## 3. Surfaces in this PRD

| # | Surface | Route | File | State |
|---|---|---|---|---|
| 9 | Personalized Ranked Feed (For You) | `/feed` (For You, premium) | `screens/Feed.tsx` → `ForYou` | Built |
| 10 | Deal Detail + Redeem | `/deal/:id` | `screens/DealDetail.tsx` | Built |
| — | DealCard | (shared) | `components/DealCard.tsx` | Built |
| — | DealGrade / grade model | (shared) | `components/DealGrade.tsx`, `lib/grade.ts` | Built (placeholder) |

## 4. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 4.1 Personalized feed — ranking (P0 — built)
- Source: `personalizedDeals` = `deals` filtered to `tier === "personalized"`, sorted by
  `relevanceScore` **descending**. This is the only sort key, and it is payout-blind by
  construction (`lib/data.ts` documents this — keep that comment).
- Header line summarizes value: total `$` in offers ranked for you · N live · "found in your
  inbox".
- Top **3** items get an inline "why you're seeing this" rationale (`showWhy={i < 3}` on
  `DealCard`); the rest stay compact to keep the list scannable.
- Staggered fade-up animation on cards (subtle, not flashy — design system: "a small win,
  not a blaring sale").
- Persistent **trust card**: "Ranked by what's best for you — fit, savings, and expiry.
  Brands never pay to rank higher." This is mandatory on the ranked view.

### 4.2 Personalized feed — entitlement & trial nudge (P0 — built)
- Only premium (`trial`/`paid`) users see ranked deals; free users get the locked upsell
  (owned by `FREE_PATH_PRD.md`).
- During trial, a footer chip shows days left → `/paywall` (conversion seam, see
  `MONETIZATION_PRD.md`). Keep it low-pressure.

### 4.3 DealCard anatomy (P0 — built)
- Brand mark (initials, category-tinted), title (H2), subtitle, **savings line in
  `--savings-600`** (both `$` and `%` where available — PRD journeys imply both), expiry
  caption, optional `UrgencyBadge` ("Ends in N days") when within the urgency window,
  optional `DealGrade` letter, and an optional `whyForYou` rationale line.
- `compact` variant (used in Savings Summary top-picks) and `showWhy` variant.
- Tapping → `/deal/:id`. Money always formatted USD via `lib/format` `usd()`; numerals
  tabular (`nums`).

### 4.4 Deal Detail — content (P0 — built)
- Header: brand, title, subtitle, brand mark.
- Savings badge + urgency/expiry. Optional price comparison (deal price big in savings
  green, original struck through) when `originalPrice`/`dealPrice` present.
- **Deal grade** card: letter + verdict + "Scored on fit, savings, and timing — never on
  what a brand pays." (payout-blind restated).
- **Promo code** block (when `code`): large dashed box, tap to copy, copied-state feedback.
- "Why this is a good deal" rationale (when `whyForYou`).
- Full **terms** (muted caption). Trust line at the bottom: surfaced because it fits you,
  not paid placement.
- Missing-deal state: "This deal is no longer available." (handles bad `:id`).

### 4.5 Deal Detail — redeem (P0 — built)
- Sticky bottom CTA, label varies by `redeemType`:
  - `code` → "Copy code & redeem" (copies to clipboard + toast "Code X copied").
  - `book` → "Book this rate" (toast "Opening booking…").
  - `link` → "Open deal" (toast "Opening deal…").
- Redeeming calls `redeem(deal.id)` (DemoContext) → flips to a **"Redeemed · saved $X"**
  confirmation state, which persists (localStorage) and feeds the savings ledger
  (`SAVINGS_PRD.md`).
- In the real app, `book`/`link` open the actual deep link/merchant URL (`deal.dealUrl`);
  in the prototype it's a toast only. Copy-to-clipboard already works for real.

### 4.6 Deal grade model (P0 placeholder; P1 real)
- `lib/grade.ts` is a **deliberately isolated placeholder**: a 0–100 composite of fit
  (`relevanceScore`) + savings depth → S/A/B/C/D with tone classes. Personalized deals weight
  fit; public deals lean on savings.
- Keep the function signature stable (`gradeForDeal(deal) → {letter, score, label, tone}`) so
  the real model swaps in without UI changes. Grading is **payout-blind** (file comment says
  so — preserve it).

## 5. Data model

Uses the existing `Deal` type (`app/src/types.ts`) — no changes needed. Key fields that drive
this surface: `tier`, `relevanceScore`, `whyForYou`, `savingsAmount`/`savingsPercent`,
`originalPrice`/`dealPrice`, `code`, `redeemType`, `dealUrl`, `expiresAt`, `terms`.

Mock-data guidance: maintain ~8–12 `personalized` deals with varied `relevanceScore`,
genuine `whyForYou` strings tied to preference seeds (e.g. "Because you follow Patagonia"),
a spread of `redeemType`, and a few near-expiry deals so urgency badges appear. "Today" for
the demo is **2026-06-15** (per `Deal.expiresAt` comment) — keep expiries relative to that.

## 6. Real webapp (forward-looking)

- **Ranking moves server-side** (`WEBAPP_MIGRATION_BUILD_PLAN.md` Phase 5): a relevance +
  savings + urgency score computed over real extracted offers, **payout-blind**, exposed as
  the feed order. The frontend keeps reading a pre-sorted list — no UI change.
- **Offers come from real extraction** (Phase 2): structured offer records (not raw email),
  linked to brands (`offerDealIds` ↔ `EnrolledBrand`). `whyForYou` becomes a real,
  explainable rationale ("you opened this brand", "matches your travel style").
- **Data layer seam**: replace direct JSON imports in `lib/data.ts` with `getDeals()` /
  `getDeal(id)` backed by the API, mock kept behind an env flag (`GMAIL_KICKOFF.md` Phase 3).
- **Redeem** wires to real deep links / `List-Unsubscribe`-independent merchant URLs, and
  (later) optional redemption tracking — but **never** an affiliate signal that feeds ranking.
- `lib/grade.ts` becomes the real value model; signature unchanged.

## 7. States to build (checklist for Cowork)

- Feed: populated ranked list; trial nudge present (trial) / absent (paid); empty state
  ("Your scan didn't find personalized deals yet — we'll keep looking"); (real) loading
  skeleton + error/retry.
- DealCard: with/without code, with/without price comparison, urgent vs not, with/without
  grade, compact vs full, showWhy on/off.
- Deal Detail: each `redeemType`; pre-redeem vs redeemed; missing-deal; long-terms scroll.

## 8. Success metrics

- Feed → deal-detail tap-through rate; rank position of tapped deals (are top picks earning
  it?).
- Redeem rate per session and per deal; copy-code success.
- "Why you're seeing this" engagement / trust survey signal.
- (Real) correlation of ranking score with actual redemptions (model quality), tracked
  **without** any payout input.

## 9. Open questions

- Show the deal grade on the feed card itself, or reserve it for detail (current: detail +
  optional card)? More grades up front = more scannable, but risks clutter.
- How explicit should `whyForYou` get about inbox content ("from your Delta receipt") vs.
  stay high-level, given privacy sensitivity?
- Pull-to-refresh on the feed (SCREENS.md mentions it) — worth the gesture plumbing in a web
  prototype, or defer to the real app?
- Do redeemed deals stay in the feed (greyed) or drop out? (Affects the savings-history story
  in `SAVINGS_PRD.md`.)
