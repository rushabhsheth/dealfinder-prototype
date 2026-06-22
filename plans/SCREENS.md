# DealFinder — Prototype Screens

The screens to build, in flow order, derived from the PRD's key user journeys
(section 4). Each screen lists its purpose, key elements, and where it goes next.
Build mobile-first inside `PhoneFrame`. All data is mocked.

There are two demo paths through the prototype:
- **Free path:** install → feed → upsell prompt
- **Premium path:** start trial → onboarding → personalized feed → paywall

---

## 1. Value Explainer (Splash / Intro)
- **Purpose:** 2–3 swipeable intro panels — what DealFinder does and the "we work for
  you, not the brands" trust promise.
- **Elements:** illustration, one-line value prop per panel, "Browse deals" (skip to
  free feed) and a secondary "How it works".
- **Next:** Free Open-Deals Feed (no signup wall).

## 2. Free Open-Deals Feed
- **Purpose:** the free tier — a curated, non-personalized feed of public deals.
- **Elements:** scrollable list of `DealCard`s, category chips, an honest "public deals"
  label, an inline **upsell banner**: "Connect your inbox and we'll find deals just for
  you — free for 14 days."
- **Next:** Deal Detail (tap a card) · Trial Intro (tap upsell).

## 3. Trial Intro / Start Trial
- **Purpose:** sell the premium agent and start the 14-day trial.
- **Elements:** coral-accent hero, 3 benefit bullets (inbox scan, auto-enroll, personal
  ranking), "Start free trial" PrimaryButton (accent variant), "no charge for 14 days".
- **Next:** Interest Survey.

## 4. Interest Survey (Onboarding)
- **Purpose:** capture personalization inputs.
- **Elements:** category multi-select, favorite brands, home airport, travel style.
  Progress indicator. All optional/skippable.
- **Next:** Connect Email.

## 5. Connect Email — PermissionSheet (mocked)
- **Purpose:** the trust-critical moment. Plain-language, read-only framing.
- **Elements:** "Connect Gmail / Outlook" buttons (mocked — no real OAuth), a clear
  **what we can see / what we can't** list, "read-only", "delete anytime". Reassuring,
  muted tone.
- **Next:** Enrollment Consent.

## 6. Enrollment Consent
- **Purpose:** consent to auto-enroll in high-value newsletters.
- **Elements:** short explainer, sample of newsletters we'd join, easy "unsubscribe
  anytime" promise, toggle/confirm.
- **Next:** First Scan (loading).

## 7. First Scan (Loading / Reveal)
- **Purpose:** the magic moment — show the agent working, then reveal results.
- **Elements:** animated "scanning your inbox…" progress, then transition to the
  savings summary.
- **Next:** Savings Summary.

## 8. "Here's what we found you" — Savings Summary
- **Purpose:** immediate proof of value inside the trial.
- **Elements:** big display number ("We found you $214 in deals"), count of offers,
  top 3 highlighted, "See my feed" PrimaryButton.
- **Next:** Personalized Ranked Feed.

## 9. Personalized Ranked Feed  ⭐ (hero screen)
- **Purpose:** the core premium experience — ranked, personalized offers.
- **Elements:** ranked list of `DealCard`s ordered by relevance/savings/urgency;
  each shows savings (green), expiry, and an UrgencyBadge where relevant; a subtle "why
  you're seeing this" line; pull-to-refresh; BottomNav. Top items feel hand-picked.
- **Next:** Deal Detail · Travel Watch · Savings Dashboard (via nav).

## 10. Deal Detail + Redeem  ⭐ (hero screen)
- **Purpose:** structured offer + one-tap action.
- **Elements:** brand, discount, **promo code (copy)**, expiry, full terms (muted),
  "why this is a good deal" note, **one-tap Redeem (copy code + deep link)** or **Book**.
- **Next:** back to feed; confirmation toast on redeem.

## 11. Travel Watch (Premium)
- **Purpose:** set a route/price watch.
- **Elements:** origin/destination, target price, "watch" toggle; a mocked active watch
  card showing a fare-drop alert state.
- **Next:** Deal Detail (alert → booking deep link, mocked).

## 12. Savings Dashboard
- **Purpose:** cumulative savings — the retention hook.
- **Elements:** total saved to date (big green number), savings over time, count of
  redeemed deals. Reinforces ongoing value.
- **Next:** —

## 13. Trial Recap + Paywall — PaywallSheet  ⭐ (hero screen)
- **Purpose:** convert trial to paid near trial end.
- **Elements:** coral-accent recap of cumulative savings, "$X saved in your trial",
  annual price (~$96/yr), "Subscribe" PrimaryButton (accent), small "maybe later".
- **Next:** Subscribed Confirmation (subscribe) · Downgraded Free Tier (decline).

## 14. Downgraded Free Tier (post-trial, no conversion)
- **Purpose:** the graceful downgrade per PRD 4.3.
- **Elements:** back on the free open-deals feed, a banner noting premium is paused
  (inbox disconnected, watches off), clear "Resubscribe" path.
- **Next:** Trial Intro / Paywall (resubscribe).

## 15. Settings & Privacy Controls
- **Purpose:** trust controls.
- **Elements:** disconnect inbox, pause scanning, delete my data, notification prefs,
  subscription status. Plain language. "Manage subscriptions" deep-links to Enrolled Brands.
- **Next:** Enrolled Brands.

## 16. Enrolled Brands  (real-webapp phase — see `ENROLLED_BRANDS_PRD.md`)
- **Purpose:** the trust ledger — one place showing every brand sending the user promos
  through DealFinder, with one-tap pause / real unsubscribe. Premium-gated.
- **Entry:** hamburger menu (`HeaderMenu.tsx`), item "Enrolled Brands", above Settings.
- **Route:** `/brands`.
- **Elements:** summary strip (N brands · M deals · $X saved); sortable/filterable list of
  brand rows, each with avatar, brand name, **source badge** (Enrolled = we subscribed you /
  Detected = already in your inbox), **status badge** (Active / Paused / Unsubscribed),
  category, deals-surfaced count, $ saved from this brand, last-offer date; a brand detail
  sheet (why/when enrolled, recent offers, controls); persistent trust line ("we never rank
  by payout"). Loading/empty/locked/error states required.
- **Controls:** Pause (stop surfacing, reversible) · Unsubscribe (**real** RFC 8058
  List-Unsubscribe) · Re-enroll. No dark patterns.
- **Next:** Deal Detail (tap a brand's offer); back to feed.

---

## Sub-PRDs — detailed specs per surface

Each surface below has a dedicated sub-PRD (this file is the one-line index; the sub-PRD is
the build spec). All cover both the **prototype** and a forward-looking **real webapp** layer,
matching the depth of `ENROLLED_BRANDS_PRD.md`. Note: the built app diverges from the original
screen list — the Feed is **unified** (For You / All Deals in one tab), onboarding is a single
**conversational "Meet Scout"** flow, Privacy is split from Settings, and there's a standalone
**Scout assistant** not in the original list. The sub-PRDs spec the real code.

| Sub-PRD | Covers (screens) | Routes |
|---|---|---|
| `FREE_PATH_PRD.md` | Value Explainer (1), free All-Deals view (2), downgrade banner (14) | `/`, `/feed` |
| `ONBOARDING_PRD.md` | Meet Scout onboarding (3), Connect Email (5), Enrollment Consent (6), First Scan (7) | `/trial`, `/connect`, `/enroll`, `/scan` |
| `CORE_FEED_PRD.md` | Personalized Ranked Feed (9), Deal Detail + Redeem (10) | `/feed`, `/deal/:id` |
| `SAVINGS_PRD.md` | Savings Summary (8), Savings Dashboard (12) | `/summary`, `/savings` |
| `MONETIZATION_PRD.md` | Paywall (13), Subscribed, Downgrade (14), entitlement/tier lifecycle | `/paywall`, `/subscribed` |
| `TRAVEL_WATCH_PRD.md` | Travel Watch (11) | `/watches` |
| `SETTINGS_PRIVACY_PRD.md` | Settings & Privacy controls (15) | `/settings`, `/privacy` |
| `ASSISTANT_PRD.md` | Scout conversational agent (not in original list) | `/chat` |
| `USER_PREFERENCES_PRD.md` | Personalization inputs storage & editing (4 + Settings) | — |
| `ENROLLED_BRANDS_PRD.md` | Enrolled Brands trust ledger (16) | `/brands` |

---

### Build priority (see BUILD_PLAN.md)
Hero screens first: **9, 10, 8, 13.** They carry the demo. The onboarding chain
(3–7) and free-tier screens (1, 2, 14) follow. Settings/dashboard (11, 12, 15) last.

Screen **16 (Enrolled Brands)** belongs to the real-webapp migration, not the mock
prototype — sequence it via `WEBAPP_MIGRATION_BUILD_PLAN.md` (Phase 4), after real OAuth,
scanning, and auto-enrollment exist.
