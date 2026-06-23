# Going.com — Raw Research Notes (crawl + screenshots)

Captured 2026-06-23 via signed-in Chrome session (account: Rushabh, **Limited** tier) plus
user-supplied screenshots of the signed-out marketing flow and mobile web. This is the raw
reference behind `plans/GOING_STRUCTURE_ANALYSIS.md`. Page text is paraphrased/condensed from
live crawls; structure (routes, nav, components) is verbatim where noted.

> Why Going: it runs **one responsive web product** that serves anonymous, free, and paid
> users across desktop and mobile web, plus a native app — exactly the cross-surface problem
> DealFinder is solving next. The patterns below are the source material for the PRD.

---

## 1. URL / route map (observed)

| Route | Purpose | Auth behavior observed |
|---|---|---|
| `going.com` (root) | Marketing home | Signed-out: marketing landing ("Save up to 90% on flights"). **Signed-in: 301 → `/deals`.** |
| `/deals` | Main deal feed (the app home) | Signed-in landing. Feed + search + filters. |
| `/deal?id=<base64>` | Deal detail | Query-param id (base64 of route+cabin+fare, e.g. `RVdSOklMTTplY29ub215OnN0YW5kYXJk` = `EWR:ILM:economy:standard`). |
| `/watchlist` | "Trips" — track destinations, get alerts | Limited tier: **gated**, shows "Upgrade to Premium" explainer (3-step how-it-works). |
| `/on-the-fly` | Content/blog hub (guides, reports, glossary) | Public. Huge editorial library. |
| `/upgrade` | Pricing / plans | Public. Premium + Elite tiers, free-trial CTA, FAQ. |
| `/booked-it` | "Have a booked flight? Let us know" | Linked from feed + footer. |
| `/premium-membership` | (footer link) | Returned 404 on direct hit during crawl — likely marketing redirect. |

Footer (same on every page) is the full secondary IA:
- **About:** How it works · About us · Diversity, Equity & Inclusion · Careers · Premium
  Membership · Elite Membership · Newsroom · Member Stories · Gift Cards · Reviews
- **Resources:** Referral Program · Cheap Flights · On the Fly Travel Guides · Travel Glossary ·
  Window Seat Blog · How to Find Cheap Flights · How to Use Google Flights · Study Abroad
  Scholarship · Travel Community · Going Gear Shop · Advertise With Us · Become an Affiliate ·
  Media Kit · Points and Miles Deals
- **Support:** Help Center · Contact Us
- Follow Us · Get the app · Terms · Privacy · © GOING 2026

---

## 2. Global navigation (observed)

### Desktop top bar (signed-in)
`[Going logo → /deals]   WATCHLIST   DEALS   ON THE FLY   [GET APP — purple pill]   [Rushabh (Limited) ▾]`
- Account control is a name + tier badge dropdown on the far right.
- "GET APP" is a persistent purple (indigo) pill — app install is pushed even to web users.

### Desktop top bar (signed-out) — from marketing pages
Same left nav (Watchlist / Deals / On the Fly) + "GET APP"; account control replaced by
**Log in / Sign up** affordances. Marketing home leads with app-install + free-trial CTAs.

### Mobile top bar (all states)
`[Going logo]   [Get App — purple pill]   [☰ hamburger]`
- Hamburger opens a **full-height slide-out drawer** (right side), dimming the page.
- Drawer header (signed-in): tier label "Limited Member", name "Rushabh", "JOINED 2026".
- Drawer items (signed-in Limited): **Deals · Watchlist · Upgrade (Premium & Elite plans —
  highlighted apricot row) · Perks · On The Fly · Refer a friend · Settings · Help · Sign Out.**
- Each item has a line icon; the Upgrade row is visually promoted (tinted background).

---

## 3. Deals feed (`/deals`)

### Desktop layout
- Green hero band: H1 "Explore your travel possibilities".
- Large **Destination search** field ("Where do you want to go?") + "Feeling Adventurous?
  Let us choose." link + "Have a booked flight? Let us know." callout.
- **Inline horizontal filter chip row** (all dropdowns): Departure Airports · Airlines · Price ·
  Stops · Months · Seating Class · Deal Type · Experience · **SAVE** (saves filter set).
- Below: the deal grid.

### Mobile layout (same content, restructured chrome)
- Same hero + search field stacked.
- Filters collapse to: a **"Sort by Featured ▾"** dropdown + a single full-width **"FILTER"**
  button (teal, bottom-anchored) that opens a filter sheet. The 8 desktop chips become the
  contents of that sheet.
- Feed header: "**11 ACTIVE DEALS**".
- Deal cards stack single-column, full-bleed image on top.

### Deal card anatomy (mobile screenshot)
- Large destination photo with a **share icon** (top-right circular button).
- Price badge: **`$526`** (apricot pill) with struck-through **`$850`** original.
- Destination "Vilnius, Lithuania"; "From EWR"; cabin "Economy"; "1-stop".
- Date band (tinted): calendar icon + "Sep – Nov".
- (Second card: "$148 · Charleston, WV".)

---

## 4. Deal detail (`/deal?id=...`) — observed verbatim structure

- Eyebrow: date window "AUG – SEP 2026".
- Title: destination "Wilmington, NC".
- **Route block:** Newark (United States) → Wilmington (United States); "SEE RETURN"; airport
  codes + leg time: `EWR Newark — 1h58m — ILM Wilmington`.
- "Have a booked flight? Let us know." callout.
- **Flight facts:** "United Airlines Bombardier Regional Jet 550", "EWR to ILM", "Economy",
  amenities row: Wifi · 30" Legroom · Seat USB.
- **Price History panel** (the trust/credibility centerpiece):
  - Normal Price (based on similar routes this year): `$282`
  - This Deal: `$197`
  - Our Threshold (highest price we'd call a deal): `$200`
  - Average Deal (previous deals this route): `$177`
  - Last Deal: `$197` · Best Deal: `$133`
- Headline price `$197` · "**30% off (normally $282+)**".
- Primary CTA: **"BOOK ON GOOGLE FLIGHTS"** (Going does not transact — it hands off to the
  booking source). Secondary: **"SHARE THIS DEAL"**.
- "Deal Details": Economy Seating · United Airlines · "Price will last 1-2 days" (urgency).
- "Other deals from my airports" → "EXPLORE ALL DEALS".

**Takeaway for DealFinder:** the deal-detail page sells the deal with *evidence* (price
history vs a threshold), a single clear action, and a share path — not hype. Matches
DealFinder's "show the number / trust is the brand" design rules.

---

## 5. Watchlist / "Trips" (`/watchlist`) — gated for Limited

- H1 "Start your Trips"; subhead: "Premium and Elite members can find, track, and get alerts
  for the destinations they want." → **"UPGRADE TO PREMIUM"** CTA.
- 3-step how-it-works: (1) Search for a destination → add to Trips; (2) Find deals just for you
  (customized to your airport→destination); (3) Get them delivered (inbox alerts on price drops).
- Repeated "UPGRADE TO PREMIUM" CTA at the bottom.
- **Pattern:** premium features are *visible but locked* to free users, with an explainer that
  doubles as the upsell. (DealFinder's "locked upsell" for the personalized feed mirrors this.)

---

## 6. Upgrade / pricing (`/upgrade`)

- Headline: "Book one flight and Going pays for itself."
- **Urgency:** live countdown "20% off – sale ends in 23h 2m 12s" (per-tier countdowns).
- **Premium — $4.08/month** · "First year: $39, then $49 billed annually."
- **Elite — $16.58/month** · "First year: $149, then $199 billed annually."
- Feature lists per tier: Points & miles deals · Mistake fares · Price alerts for your next
  trip · International deals · Business and first class deals. (Elite adds "Lie-flat seats
  powered by your points".)
- Primary CTA: **"TRY PREMIUM FREE"** (free trial as the entry, not direct purchase).
- **FAQ accordion** addressing objections: "I only travel once a year — worth it?", "deals too
  good to be true?", "is Limited fine?", "Premium vs Elite", "can I still get deals if I don't
  upgrade?", etc.

**Takeaway:** annual billing shown as a small monthly number; free trial is the funnel entry;
urgency via countdown; objection-handling FAQ. Maps directly to DealFinder's
`MONETIZATION_PRD.md` paywall.

---

## 7. On the Fly (`/on-the-fly`) — content hub

- Editorial library: category nav (Airlines, Airports, Business & Premium Classes, Car Rentals
  & Roadtrips, Destinations, Flight Booking, Food, Holiday Travel, Layovers, News, Points/Miles
  & Credit Cards, Reports, Travel Tips).
- Section rails: Reports · Most recent · Travel tips · Become a flight expert · Get inspired ·
  Points/miles · Airline guides · Airports · Layovers · Fly in style · Hitting the road · Going
  in the news · Travel terms to know (glossary teasers).
- Drives SEO + top-of-funnel; every page has "Explore the Going app" + footer.

---

## 7b. Going Android app (user screenshots) — the full feature set web omits

Bottom nav: **Explore · Trips · Alerts · Profile**.

- **Explore (deals):** search "Search all deals" + filter icon; chip filters EWR / Any stops /
  All cabins; "**41 deals available**"; "**Staff picks**" rail (e.g. Lithuania $850→$526, Sep–Nov,
  EWR) above "**All deals**"; a **Map** toggle on cards; "Add more airports to see more deals".
- **Trips (gated):** "Set a custom alert. We'll track the deals." · "14-day trial, no payment due
  now. $49.00/year. Cancel anytime." · push-notification mock ("Your tracked flight to London
  Sep 15–22 went down to $398 (was $544)") · "Why you'll love Premium" · **Your plan vs Premium**
  feature comparison table (Trip alerts ✗/✓, Points deals…) · **Start free trial** · "+ 20% off".
- **Alerts:** notification center; empty state "No new notifications. You can review your
  preferences anytime." · **Manage notifications**.
- **Flight alerts (preference matrix):** grouped cards Domestic deals / International deals /
  Mistake fares (From your airports / From all US airports) / Points and miles, each a matrix of
  cabin (Economy / Premium economy / Business / First) × channel (**Email / Push**) toggles, with
  a master toggle per group.
- **Profile:** **Notifications** (Flight alerts ›, Marketing alerts ›) · **Account** (Login and
  security ›, Membership & billing ›, My airports ›, Refer a friend ›) · **Help & Support** (Get
  help ↗, FAQs ›, Points deal analyzer ›, Terms & conditions ›, Privacy policy ›) · **Log Out** ·
  "Version: 4.17.0.816 · © 2026 Going."

**Key implication:** this app surface set is far richer than Going's web. For DealFinder it is the
*checklist of full-featured web* (deferring the app), not a gating model — see §8.6.

## 8. Cross-surface / responsive principles distilled (the reusable lessons)

1. **One responsive web app, content parity across breakpoints.** Same routes, same data,
   same deal content on desktop and mobile — only the *chrome* reflows.
2. **Navigation reflow:** desktop = persistent inline top nav + account dropdown; mobile =
   logo + Get App + hamburger drawer (with tier badge + full menu).
3. **Filter reflow:** desktop = inline chip row; mobile = "Sort by" dropdown + a "FILTER"
   button that opens a sheet containing the same controls.
4. **Feed reflow:** desktop = wider grid; mobile = single-column stacked cards.
5. **Tiering is a first-class state machine:** anonymous → free (Limited) → paid (Premium/Elite),
   with premium features *visible-but-locked* and an explainer that doubles as the upsell.
6. **App install is pushed everywhere** (persistent "Get App" pill) — web is the funnel, the
   app is the retention surface, and the full feature set (Trips, Alerts center, preference
   matrices, billing, analyzer — see §7b) is **app-only**. **DealFinder inverts this:** make
   desktop + mobile web full-featured after sign-in *now*, and only later strip web features to
   drive installs (behind a flag). Going's app tab-set is therefore our *full-featured-web
   checklist*, not a gating blueprint.
7. **Trust via evidence, not hype:** price history vs threshold; "30% off (normally $282+)";
   calm copy. Mirrors DealFinder's payout-blind, "show the number" rules.
8. **Single clear action + share** on the deal detail; Going hands off to the booking source
   rather than transacting.
