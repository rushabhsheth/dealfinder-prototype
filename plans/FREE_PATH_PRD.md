# Sub-PRD — Free Path & Acquisition

Companion to `PRDs/DealFinder_PRD.docx` (§4.1 Free tier, §4.3 Downgrade) and a sibling to
`plans/ENROLLED_BRANDS_PRD.md` / `plans/USER_PREFERENCES_PRD.md`. This sub-PRD scopes the
**unauthenticated / free-tier surface** — the first thing a new user sees, the public deal
catalog they can browse without connecting anything, and the upsell + downgrade states that
push toward (or back into) premium.

It covers both layers:
- **Prototype** (the web mock we are building now) — client-side state, mock JSON.
- **Real webapp** — forward-looking notes on what changes once a backend exists.

> **Naming.** The free experience is presented as part of one unified **"Deals"** tab with
> two views: **For You** (premium, personalized) and **All Deals** (the public catalog,
> same for everyone). There is no separate "free feed" route — free users land on **All
> Deals** and see a **For You** that's locked behind a connect-inbox upsell.

---

## 1. Problem & why now

DealFinder is freemium. The free tier has one job: **prove the product is credible and
useful enough that handing over your inbox feels worth it.** A new user who hits a signup
wall, or a downgraded user who feels punished, never gets to the value moment.

Today the relevant pieces already exist in code but are spread across the unified
`Feed.tsx`, `ValueExplainer.tsx`, and the `UpsellNudge` component, with no single spec that
says what the free path *is*, what each state must contain, and where it routes. This
sub-PRD consolidates that so Cowork can finish and polish it as one coherent surface.

The free path is also the **re-entry point after a lapsed trial** (PRD §4.3): a converted
or churned user comes back here, so it must hold both "never tried premium" and "premium
paused" states without feeling like two different apps.

## 2. Goals & non-goals

**Goals**

- Let anyone browse a curated **public deal catalog** immediately, with **no signup wall**
  (CLAUDE.md / SCREENS.md: "no signup wall").
- Make the value proposition legible in seconds via the **Value Explainer**, then hand off
  to the trial without friction.
- Surface a calm, honest **upsell** ("connect your inbox and we'll find deals just for you")
  that sells personalization without dark patterns or fake scarcity.
- Hold the **downgraded** state gracefully — premium paused, clear resubscribe path, no
  guilt copy, no removed-access shaming.

**Non-goals**

- No real auth or account creation on the free path (CLAUDE.md hard rule; auth only enters
  with the real Gmail slice).
- No personalization of the public catalog — "All Deals" is identical for everyone, by
  design (it's the honest, payout-blind public set).
- Not the paywall itself — conversion mechanics live in `MONETIZATION_PRD.md`. This surface
  only *routes into* the trial/paywall.

## 3. Surfaces in this PRD

| # | Surface | Route | File | State |
|---|---|---|---|---|
| 1 | Value Explainer (intro panels) | `/` | `screens/ValueExplainer.tsx` | Built |
| 2 | Free feed — **All Deals** view | `/feed` (default for free) | `screens/Feed.tsx` → `AllDeals` | Built |
| 2b | **For You (locked)** upsell | `/feed` (For You tab, free) | `screens/Feed.tsx` → `ForYouLocked` | Built |
| 2c | Connect-inbox nudge banner | top of `/feed` | `components/UpsellNudge.tsx` | Built |
| 14 | Downgraded banner | top of `/feed` All Deals | `screens/Feed.tsx` (`downgraded` block) | Built |

This PRD treats them as one surface because they share state (`tier`, `downgraded`,
`nudgeDismissed`) and the user moves between them without leaving the tab.

## 4. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 4.1 Value Explainer (P0 — built, refine)
- 3 swipeable panels (arrows + dots), each one illustration + title + one-line value prop:
  (1) "Deals hide in your inbox", (2) "Ranked just for you", (3) "We work for you, not
  brands" — the trust promise, explicit about read-only and payout-blind ranking.
- Single primary CTA — **"Start finding deals"** → `/trial` (the conversational onboarding).
- **Gap to close:** SCREENS.md calls for a secondary **"Browse deals"** path that skips
  straight to the free `/feed` without entering the trial flow. Today the only CTA pushes
  into `/trial`. Add a low-emphasis secondary action ("Just browse public deals") → `/feed`
  so the no-signup-wall promise is real from the first screen.
- Should be skippable/returnable: it is the `/` index, so demo resets land here.

### 4.2 All Deals — the public catalog (P0 — built)
- Renders `publicDeals` (mock `tier: "public"` deals from `data/deals.json`) as `DealCard`s.
- Category chips (`All · Travel · Retail · Dining · Tech`) filter the list client-side.
- Honest label: **"Public deals · same for everyone"** with a lock glyph — never imply
  these are personalized.
- Default view for `tier === "free"` (and for downgraded users). Premium users default to
  **For You** but can toggle here.
- Tapping a card → `/deal/:id` (shared Deal Detail, see `CORE_FEED_PRD.md`).

### 4.3 For You (locked) upsell (P0 — built)
- When a free user taps the **For You** segment, show the locked state, not deals:
  mail+sparkle motif, "Deals picked for you", one paragraph selling the read-only inbox
  scan and payout-blind ranking, and an apricot **"Start free trial"** CTA → `/trial`.
- Reassurance line: "Read-only · free for 14 days · cancel anytime."
- Never show blurred fake deals behind the lock (no teasing dark pattern) — sell the idea,
  not a faked result.

### 4.4 Connect-inbox nudge (P0 — built)
- `UpsellNudge` banner at the top of the feed for free users, until dismissed.
- Dismissal is **in-memory only** (intentional, per `DemoContext`): it returns on a fresh
  app open but stays hidden while navigating around in a session. Keep this behavior — it's
  a deliberate demo choice, documented in `DemoContext.nudgeDismissed`.
- Tapping the nudge routes into `/trial`.

### 4.5 Downgraded state (P0 — built; see also `MONETIZATION_PRD.md`)
- When `downgraded === true`, show a card at the top of **All Deals**: "Premium is paused —
  your inbox is disconnected and fare watches are off," + a **Resubscribe** CTA → `/paywall`.
- The For You tab stays locked (same as never-subscribed free), and the nudge logic still
  applies. No access is "taken away" angrily — the public catalog remains fully usable.
- Copy is factual and reversible-feeling. No countdown, no "you lost $X" guilt.

### 4.6 Routing & entitlement (P0)
- `/free` is an alias that redirects to `/feed` (already wired in `App.tsx`).
- The default segment is derived from tier: premium → For You, free/downgraded → All Deals.
- Everything on this surface is reachable without auth.

## 5. Data model

No new types. This surface reads:
- `publicDeals` from `lib/data.ts` (filtered `Deal[]` where `tier === "public"`).
- `tier`, `downgraded`, `nudgeDismissed`, `dismissNudge` from `DemoContext`.

Public deals in mock data should stay **distinct from personalized deals** (no `whyForYou`,
no `relevanceScore`) so the two views feel genuinely different. Maintain ~8–12 public deals
across all four categories so the chips have content.

## 6. Real webapp (forward-looking)

- **Public catalog** becomes a server-curated, payout-blind editorial set behind
  `GET /deals/public` (cacheable, same for all users) — not derived from any user's inbox.
  This keeps the free tier honest and cheap (no per-user scanning cost).
- **No auth still required to browse**: the public catalog is anonymous-accessible; auth is
  only required to start the trial / connect Gmail (see `ONBOARDING_PRD.md`).
- The **For You locked** state and **downgrade** state are driven by the entitlement service
  (`MONETIZATION_PRD.md`), not local `tier` state.
- Analytics: instrument explainer-completion, browse-without-trial rate, nudge CTR, and
  downgrade→resubscribe rate as the core free-funnel metrics (§8).
- The nudge's in-memory dismissal becomes a per-session (not per-account) rule server-side,
  so we don't nag across devices but still re-prompt occasionally.

## 7. States to build (checklist for Cowork)

- Value Explainer: 3 panels, primary CTA → trial, **secondary CTA → browse (NEW)**.
- All Deals: populated list, category-filtered, empty-category state ("No public deals in
  Dining right now").
- For You locked (free) and For You locked (downgraded) — same component, copy may differ.
- Nudge: visible / dismissed.
- Downgraded banner: present only when `downgraded`.
- Deep-link safety: visiting `/feed` directly (no prior state) defaults correctly by tier.

## 8. Success metrics

- **No-wall proof**: % of new sessions that view ≥1 public deal before any auth prompt.
- Explainer → trial start conversion.
- Browse-only → trial conversion (the slow-burn path).
- Nudge CTR and trial-start attribution.
- Downgrade → resubscribe rate (the §4.3 graceful-downgrade payoff).

## 9. Open questions

- Should the secondary "just browse" CTA appear on every explainer panel or only the last?
  (Recommend: a persistent low-emphasis link under the primary CTA.)
- Do downgraded users keep their old personalized deals visible as read-only history, or is
  For You fully locked? (Current: fully locked. Revisit once savings history matters — see
  `SAVINGS_PRD.md`.)
- Does the public catalog need its own light personalization (e.g. surface picked categories
  first) without crossing into "personalized," or does that blur the honest distinction?
