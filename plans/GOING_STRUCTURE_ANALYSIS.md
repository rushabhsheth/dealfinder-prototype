# Going.com — Website Structure Analysis (signed-in vs signed-out × desktop vs mobile web)

Reference research for the DealFinder responsive web effort. Raw crawl + screenshot notes live
in `plans/research/GOING_RAW_NOTES.md`; this doc is the *analysis* — what Going does across the
four surfaces and which patterns DealFinder should adopt, adapt, or reject. The companion build
spec is `plans/RESPONSIVE_WEB_PRD.md`.

Going is a useful model because it ships **one responsive web product** that serves anonymous,
free ("Limited"), and paid ("Premium"/"Elite") users on both desktop and mobile web, alongside
a native app — the exact cross-surface, multi-tier shape DealFinder is moving toward.

---

## 1. The two axes

Going's experience is defined by two independent axes that compose into a matrix:

- **Auth/entitlement axis:** Anonymous (signed-out) → Limited (signed-in, free) → Premium /
  Elite (paid). Each step unlocks data and features; locked features stay *visible* as upsell.
- **Viewport axis:** Desktop web → Mobile web (→ native app). Same content and routes; the
  navigation, filters, and layout *reflow* rather than fork into separate products.

The product is the **cell** where these intersect. Going keeps content identical down each
column and changes only the chrome across the viewport axis; it changes data/features across the
auth axis. That separation — *content parity across viewports, capability gating across tiers* —
is the single most important thing to copy.

---

## 2. Information architecture

Going's IA is shallow and stable. The primary surfaces, all sharing one global header/footer:

| Surface | Route | Role |
|---|---|---|
| Marketing home | `going.com` (signed-out) | Top-of-funnel; converts to trial/app. Signed-in users are redirected straight to `/deals`. |
| Deals feed | `/deals` | The product home. Search + filters + ranked/featured deal grid. |
| Deal detail | `/deal?id=…` | One deal, with price-history evidence + a single book action + share. |
| Watchlist ("Trips") | `/watchlist` | Track destinations & get alerts. **Locked for free users** (upsell explainer). |
| Upgrade / pricing | `/upgrade` | Premium/Elite tiers, free-trial CTA, urgency countdown, objection FAQ. |
| On the Fly | `/on-the-fly` | Editorial/SEO content hub (guides, reports, glossary). |
| Account/Settings, Perks, Refer, Help | (in account menu) | Secondary, reached from the account control / drawer. |

A persistent **footer** carries the long tail (About, Resources, Support, legal, social, app
links) identically on every page and at every breakpoint — the IA "safety net".

**Lesson for DealFinder:** keep a shallow route set, one global header + footer shared across
breakpoints, and treat premium surfaces as visible-but-locked rather than hidden.

---

## 3. Navigation across the four surfaces

The clearest responsive lesson is how the *same* navigation reflows.

**Desktop, signed-out:** inline top bar — logo, `Watchlist / Deals / On the Fly`, a purple
"Get App" pill, and `Log in / Sign up`. Marketing-led; CTAs push trial + app.

**Desktop, signed-in:** identical inline bar, but the auth slot becomes a **name + tier
dropdown** ("Rushabh (Limited) ▾") exposing the account menu. The logo routes to `/deals`, not
the marketing home.

**Mobile, both states:** the inline bar collapses to `logo · Get App · ☰`. The hamburger opens
a **full-height slide-out drawer**:
- Header shows identity + tier ("Limited Member · Rushabh · Joined 2026") when signed in.
- Items: Deals · Watchlist · **Upgrade (highlighted)** · Perks · On The Fly · Refer a friend ·
  Settings · Help · Sign Out. The Upgrade row is visually promoted with a tinted background.

So one nav model yields four presentations: inline-with-login, inline-with-account-dropdown,
drawer-anonymous, drawer-with-tier-header. **The menu *contents* are driven by auth; the menu
*form* is driven by viewport.**

---

## 4. The deals feed — content parity, chrome reflow

The feed is the canonical example of "same content, reflowed chrome":

| Element | Desktop | Mobile |
|---|---|---|
| Search | Large destination field in a hero band | Same field, stacked |
| Filters | **Inline chip row** (Departure Airports, Airlines, Price, Stops, Months, Seating Class, Deal Type, Experience) + Save | **"Sort by ▾" + a full-width "FILTER" button** opening a sheet with the same controls |
| Results | Wider multi-column grid | Single-column stacked cards |
| Card | Photo, price pill + struck-through original, destination, origin, cabin, stops, date band, share icon | Identical card, full-bleed |
| Count | "N ACTIVE DEALS" header | Same |

The deal **card** itself is constant: destination photo, an apricot price pill with a
struck-through original price (anchoring the saving), destination + origin airport + cabin +
stops, a tinted date band, and a share affordance. Nothing about the card changes between
breakpoints except column count.

---

## 5. Deal detail — selling with evidence

Going's deal page is a strong model for DealFinder's "Deal Detail + Redeem" hero screen. It
leads with facts, not adjectives:

- Route block (origin → destination, airport codes, leg duration, "see return").
- Flight facts (airline, aircraft, cabin, amenities: wifi / legroom / USB).
- A **Price History panel**: Normal Price, This Deal, Our Threshold ("the highest price we'd
  call a deal"), Average Deal, Last Deal, Best Deal — the credibility centerpiece.
- Headline price + "30% off (normally $282+)".
- **One** primary action ("Book on Google Flights" — Going hands off, doesn't transact) plus
  "Share this deal".
- Light urgency ("Price will last 1-2 days") and a "more deals from your airports" rail.

This is exactly the calm, evidence-first posture DealFinder's design system mandates ("always
show the number", "confidence, not shouting"). DealFinder's analog: deal grade + savings ($/%) +
"why this is a good deal" + one-tap redeem + share — with the same single-action discipline.

---

## 6. Tiering & monetization as a state machine

Going treats entitlement as a first-class, visible state:

- **Anonymous:** marketing home, public deals teaser, every path leads to trial/app.
- **Limited (free, signed-in):** full featured deals feed, but **Watchlist/Trips is locked** —
  the locked page *is* the upsell (a 3-step explainer ending in "Upgrade to Premium").
- **Premium / Elite (paid):** unlocks tracked trips, alerts, and richer deal types (mistake
  fares, points & miles, international, business/first).

The `/upgrade` page sells with: a tiny monthly-equivalent price for an annually-billed plan, a
live **urgency countdown**, per-tier feature lists, a **free-trial-first** CTA, and an
objection-handling **FAQ**. DealFinder's `MONETIZATION_PRD.md` paywall should reuse this shape
(trial entry, savings-recap framing, annual price, calm urgency).

---

## 7. What DealFinder should adopt, adapt, or reject

**Adopt**
- One responsive web app: content parity across breakpoints, capability gating across tiers.
- Nav reflow: desktop inline bar + account dropdown ↔ mobile logo+hamburger drawer with a
  tier-aware header.
- Filter reflow: desktop inline controls ↔ mobile "Sort" + "Filter" sheet.
- Visible-but-locked premium surfaces whose locked state doubles as the upsell.
- Evidence-first deal detail: a "why this is a good deal" panel (DealFinder's grade + savings
  math is the analog of Going's price-history panel), one primary action, a share path.
- A shared global footer carrying the long-tail IA at every breakpoint.

**Adapt**
- Going pushes app-install everywhere (web is the funnel, app is retention). DealFinder is
  **web-first** for now, so invert: web is the primary surface; reserve a low-key "get the app"
  slot for later rather than making it a persistent purple CTA.
- Going's deal cards are travel-shaped (airports, cabins, dates). DealFinder cards are
  brand/offer-shaped (brand mark, code, savings $/%, expiry) — keep DealFinder's card anatomy,
  borrow the price-anchoring (struck-through original) and share affordance.
- Account dropdown contents map to DealFinder's surfaces (Feed, Watches, Savings, Enrolled
  Brands, Settings, Privacy, Scout) rather than Going's.

**Reject / be careful with**
- Going's redirect of the marketing home to `/deals` for signed-in users is fine, but
  DealFinder's signed-out home is a **trust-and-consent** story (we'll read your inbox), so its
  marketing must lead with the read-only/privacy promise, not just "save 90%".
- Aggressive countdown urgency on pricing: acceptable, but DealFinder's brand is calmer — use
  urgency sparingly and never on the ranked feed (payout-blind, no fake scarcity on deals).
- Never let any responsive/tier treatment imply sponsored deals rank higher (CLAUDE.md hard
  rule 6) — Going mixes "Featured" sorting; DealFinder's ranked feed must stay payout-blind and
  say so on every breakpoint.

---

## 8. Going's native app vs web — and DealFinder's deliberate divergence

The Going **Android app** is where the real product lives. Its bottom nav is four tabs —
**Explore · Trips · Alerts · Profile** — and each is substantially richer than the web:
- **Explore:** the deal feed with chip filters (EWR / Any stops / All cabins), a filter icon, an
  "N deals available" count, a "Staff picks" rail above "All deals", and a **Map** view.
- **Trips:** tracked destinations + custom alerts (gated; "Start free trial", "Your plan vs
  Premium" comparison table, 14-day trial / $49/yr).
- **Alerts:** an in-app notification center ("No new notifications", "Manage notifications").
- **Profile:** Notifications (Flight alerts + Marketing alerts), a detailed **Flight-alerts
  toggle matrix** (Domestic / International / Mistake fares / Points & miles × Economy / Premium
  / Business / First × Email / Push), Account (Login & security, Membership & billing, My
  airports, Refer a friend), Help & Support (Get help, FAQs, Points deal analyzer, Terms,
  Privacy), Log Out, app version.

Compared to this, Going's **web is intentionally thin** — browse/search deals and a deal page,
but tracking, the alerts center, the preference matrices, billing, and the analyzer are
effectively app-only, with "Get App" pushed on every web page. **Web is the funnel; the app is
the product and the retention surface.**

**DealFinder's stance is the opposite (per product direction):** make **desktop and mobile web
full-featured after sign-in now**, and only **later** withdraw functionality from web to drive
app installs (once native apps exist). So Going's app tab-set is not a model for *gating* — it's
our **checklist of what "full-featured" must mean on web**: a complete Explore/feed (with
filters, staff picks, map-later), Trips/Watches, an Alerts/notification center + preference
matrix, and a full Profile/Settings/billing surface — all usable on web at both breakpoints.
The install-driving move is deferred and should be built behind a flag so it's reversible (see
`RESPONSIVE_WEB_PRD.md` §2 and §7).

## 9. The 2×2 at a glance

| | **Desktop web** | **Mobile web** |
|---|---|---|
| **Signed-out** | Marketing home, inline nav + Log in/Sign up, public-deal teaser, trial/app CTAs | Marketing home stacked, logo+Get App+hamburger, same CTAs |
| **Signed-in (free/Limited)** | `/deals` feed, inline filter chips, multi-column grid, account dropdown, locked Watchlist upsell | Feed with Sort+Filter sheet, single-column, drawer with tier header, locked Watchlist |
| **Signed-in (Premium/Elite)** | Same feed + unlocked Trips/alerts + richer deal types | Same, reflowed |

DealFinder's job: build the same 2×2 (anonymous / free / premium × desktop / mobile web), with
content parity down each column and capability gating across, while preserving its calmer,
trust-first, payout-blind brand.
