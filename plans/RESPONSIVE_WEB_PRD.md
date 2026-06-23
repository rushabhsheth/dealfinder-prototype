# Sub-PRD — Responsive Web (signed-out & signed-in × desktop & mobile web)

Companion to `PRDs/DealFinder_PRD.docx` and a cross-cutting sibling to every screen sub-PRD in
`plans/` (`FREE_PATH_PRD.md`, `ONBOARDING_PRD.md`, `CORE_FEED_PRD.md`, `SAVINGS_PRD.md`,
`MONETIZATION_PRD.md`, `TRAVEL_WATCH_PRD.md`, `SETTINGS_PRIVACY_PRD.md`, `ASSISTANT_PRD.md`,
`ENROLLED_BRANDS_PRD.md`). Research basis: `plans/GOING_STRUCTURE_ANALYSIS.md` +
`plans/research/GOING_RAW_NOTES.md`.

This PRD scopes **how the existing DealFinder web app becomes a true responsive product** that
works full-screen on desktop and on mobile web, for both **signed-out** and **signed-in** users
— rather than the current single mobile-framed layout. It does **not** change *what* each screen
does (the screen sub-PRDs own that); it defines the responsive shell, navigation, auth/entitlement
surfaces, and the desktop layouts those screens render into.

iOS/Android native apps are **explicitly out of scope** for this PRD (deferred).

> **Trust is the brand (CLAUDE.md hard rule 6).** Every breakpoint and every auth state keeps the
> payout-blind promise legible. No responsive or tier treatment may imply a deal is sponsored or
> ranks higher. The ranked feed stays payout-blind on desktop exactly as on mobile.

---

## 1. Problem & why now

The prototype was built mobile-first and wrapped *every* route in `PhoneFrame`
(`app/src/components/PhoneFrame.tsx`) — a fixed ~390×844 device frame with simulated notch and
status bar. That was right for demoing a mobile app, but it means **the live web app
(`dealfinder-webapp.vercel.app`) renders as a phone-sized card centered on a desktop screen**:
on a 1440px display the product occupies ~390px and looks like a preview, not an app. There is
also no real signed-out web experience and no desktop layout for any screen.

We researched **Going.com**, which runs one responsive web product across anonymous → free
("Limited") → paid ("Premium"/"Elite") users on desktop and mobile web. The lesson we adopt is
its **structure** — content parity across breakpoints, capability gating across tiers, a nav that
reflows rather than forks. The lesson we deliberately **invert** is its strategy (see §2).

## 2. Strategic stance — full-featured web first (the key divergence from Going)

Going keeps its **web thin on purpose**: meaningful functionality (tracked Trips, the Alerts
center, flight-alert preference matrices, the points deal analyzer, membership/billing, profile)
lives in the **native app**, and web is largely a funnel that pushes "Get App" everywhere. Its
app bottom-nav (Explore · Trips · Alerts · Profile) is the real product; web is the teaser.

**DealFinder takes the opposite stance, in two phases:**

- **Phase A (this PRD, now):** desktop web *and* mobile web are **full-featured after sign-in** —
  every capability the product has is usable on the web at both breakpoints. We do **not** gate
  features behind an app install. The "get the app" idea is reserved as a low-key, optional slot,
  not a wall.
- **Phase B (later, not built here):** once native apps exist and we want to drive installs, we
  may **selectively withdraw** functionality from web (mirroring Going). To make that cheap and
  reversible, Phase A ships behind a single config seam (§7) so any surface can later be flipped
  to a "continue in the app" state without re-architecture.

So Going's native-app surface set (Explore/Trips/Alerts/Profile + their detail screens) is our
**checklist of what "full-featured" must include on web today** — not a description of how we
gate. DealFinder's equivalents already exist as routes (Feed, Watches, Savings, Enrolled Brands,
Settings, Privacy, Scout); this PRD makes them all first-class on desktop.

**Goals**
- Replace the fixed phone frame with a **responsive shell**: mobile web behaves as today; desktop
  web becomes a real full-width app with desktop navigation and multi-column layouts.
- Define the **signed-out** web experience (marketing/landing + public deals + auth entry) and
  the **signed-in** experience (full app), each at desktop and mobile breakpoints.
- Reach **feature parity across breakpoints** post sign-in — nothing usable on mobile web is
  missing on desktop web, and vice versa.
- Ship a **gating seam** so Phase B app-install pushes are a config change, not a rebuild.

**Non-goals**
- No new product features or screens — only their responsive presentation and the auth shell.
- No native iOS/Android app (deferred).
- No change to ranking, grading, extraction, or the payout-blind guarantee.
- No real billing/OAuth beyond what the referenced sub-PRDs already define.

## 3. The 2×2 surface matrix

This PRD's deliverable is making each cell real. Content is identical down each column; chrome
and layout reflow across the viewport axis.

| | **Desktop web (≥1024px)** | **Mobile web (<768px)** |
|---|---|---|
| **Signed-out** | Marketing landing (trust-first), public "All Deals" teaser, top nav with **Log in / Sign up**, footer IA. CTAs → start free trial / connect inbox. | Same content stacked; top bar = logo · (optional Get App) · ☰ drawer with Log in / Sign up. |
| **Signed-in — Free** | Full app shell: persistent top nav + (optional) left rail; **All Deals** feed in multi-column grid; personalized feed shown **locked** with upsell; account menu. | Full app shell: bottom nav; single-column feed; Sort + Filter sheet; drawer/account sheet. |
| **Signed-in — Premium (trial/paid)** | Everything above, unlocked: personalized **For You** ranked feed, Travel Watches, Savings dashboard, Enrolled Brands, Scout — all desktop-laid-out. | Same, reflowed to one column. |

Tablet (768–1023px) is a transitional breakpoint: it uses the desktop nav model with the mobile
single-or-two-column content grid (see §6).

## 4. Information architecture (DealFinder, mapped from research)

DealFinder keeps its existing shallow route set (`app/src/App.tsx`). This PRD assigns each route
a place in the responsive nav and an auth requirement. "Full-featured web" = all of these are
reachable and usable at both breakpoints when signed in.

| Route | Surface | Auth | Primary nav location |
|---|---|---|---|
| `/` | Value Explainer / **marketing landing** | Public | — (entry) |
| `/feed` | Unified Feed (For You / All Deals) | Public (All Deals) / Premium (For You) | **Primary nav: Deals** |
| `/deal/:id` | Deal Detail + Redeem | Public to view; redeem may prompt auth | from feed |
| `/watches` | Travel Watches | Premium (locked upsell for free) | **Primary nav: Watches** |
| `/savings` | Savings Dashboard | Signed-in | **Primary nav: Savings** |
| `/chat` | Scout assistant | Signed-in | Primary nav or persistent launcher |
| `/brands` | Enrolled Brands (trust ledger) | Premium | Account menu / nav (real-webapp) |
| `/trial`, `/paywall`, `/subscribed` | Trial & conversion | Public → Signed-in | CTA-driven |
| `/connect`, `/enroll`, `/scan`, `/summary` | Onboarding chain | Signed-in | flow |
| `/settings`, `/privacy` | Settings & Privacy controls | Signed-in | **Account menu** |
| `/signin`, `/auth/callback`, `/connect/callback` | Auth | Public | nav CTA |

**Footer (new, shared at all breakpoints)** — a Going-style persistent footer carrying the long
tail: About / How it works · Privacy · Terms · Help · (later) content/guides · "Trust: we never
rank by payout" line · © DealFinder. This gives signed-out users the IA safety net and reinforces
trust on every page.

## 5. Navigation model (reflows by breakpoint, contents by auth)

One nav model, four presentations — the core Going pattern we adopt.

**Desktop (≥1024px) — persistent top bar (+ optional left rail)**
- Left: DealFinder logo → `/feed` (signed-in) or `/` (signed-out).
- Center/left links: **Deals · Watches · Savings · (Scout)**. Premium-locked items still show,
  with a small lock affordance for free users (visible-but-locked).
- Right (signed-out): **Log in** · **Start free trial** (apricot accent CTA).
- Right (signed-in): **account dropdown** — name + tier badge (Free / Trial · N days left /
  Premium), opening: Savings, Enrolled Brands, Settings, Privacy, Help, Sign out. Mirrors Going's
  desktop account dropdown and the app's Profile section.
- Optional **left rail** on wide screens for the primary destinations if we prefer an app-shell
  look over top-only nav (decide in design; either satisfies parity).

**Mobile (<768px) — bottom nav + drawer/sheet**
- **BottomNav** stays the primary destination switch (existing `BottomNav.tsx`: Feed, Watches,
  Savings, Settings; active in `--teal-600`). This is DealFinder's analog of Going's app bottom
  nav (Explore/Trips/Alerts/Profile) — keep it, it's the right mobile pattern.
- Top app bar: logo · (optional Get App, Phase B) · account/menu entry.
- Account & secondary items open as a **drawer or full-screen sheet** with a tier-aware header
  (name + tier badge), mirroring Going's mobile drawer.

**Tier badge** is a shared component surfaced in both the desktop dropdown and the mobile drawer
header: Free · Trial (N days left) · Premium. Trial state deep-links to `/paywall`
(`MONETIZATION_PRD.md`), low-pressure.

## 6. Responsive layout system

Replace the device frame with fluid layout primitives. Build at three breakpoints using
Tailwind tokens already in `prototype/tailwind.config.ts` (extend as needed).

- **Breakpoints:** mobile `<768`, tablet `768–1023`, desktop `≥1024` (wide `≥1280` may widen the
  content max-width). Keep the existing 390px design as the mobile baseline.
- **Remove `PhoneFrame` as the global wrapper.** Introduce an `AppShell` that renders:
  desktop/tablet → top bar (+ optional rail) + fluid content + footer; mobile → content +
  BottomNav (+ top app bar) + footer. `PhoneFrame` may be retained **only** as an optional
  "device preview" wrapper for demos behind a flag — never the default.
- **Content width:** centered max-width container (~1120–1200px) on desktop; full-bleed sections
  (hero, footer) may span wider. 16px gutters on mobile, larger on desktop.
- **Feed grid (the marquee reflow):** mobile = 1 column of `DealCard`s; tablet = 2 columns;
  desktop = 3 (wide = 3–4). The `DealCard` component is unchanged — only the grid container
  changes. Preserve "Staff picks / For You" highlighted rail above "All Deals" (matches both
  Going web's featured sort and the app's "Staff picks → All deals" structure).
- **Filters reflow (Going's clearest pattern):** mobile = a **"Sort by ▾" control + a "Filter"
  button** that opens a sheet containing the controls (the app uses chips like EWR / Any stops /
  All cabins + a filter icon + "N deals available" — replicate as DealFinder category/savings
  filters); desktop = the same controls **inline** as a persistent chip/toolbar row above the
  grid. Same filter state, two presentations.
- **Deal Detail reflow:** mobile = single column, sticky bottom redeem CTA (as today); desktop =
  two-column (media/summary left, the redeem panel + grade + "why this is a good deal" as a
  **sticky right sidebar**), evidence-first like Going's price-history panel.
- **Forms/sheets (onboarding, paywall, connect, settings):** mobile = full-screen steps / bottom
  sheets; desktop = centered modal/card with constrained width. The PaywallSheet and
  PermissionSheet keep their copy and trust framing (design system) — only container changes.
- **Alerts/notifications & preference matrices** (from Going app's Flight-alerts toggle grid):
  DealFinder's notification preferences (`SETTINGS_PRIVACY_PRD.md`) render as a responsive
  toggle table — stacked rows on mobile, aligned columns (e.g. Email / Push) on desktop.
- **Touch vs pointer:** ≥44px touch targets on mobile; hover/focus states meaningful on desktop;
  all interactive controls keyboard-navigable (the device frame previously hid this gap).

## 7. Auth / entitlement state & the Phase-B gating seam

- **Auth states:** anonymous (signed-out) · authenticated-free · authenticated-trial ·
  authenticated-paid · downgraded-free. The existing `DemoContext` (`app/src/state/DemoContext.tsx`)
  already models tier; extend it to also model **signed-in vs signed-out** explicitly so the shell,
  nav, and locks key off one source of truth.
- **Signed-out capabilities:** view marketing landing, browse **public All Deals** + deal detail,
  read footer/legal/help. Personalized feed, watches, savings, brands, scan are **gated** →
  routed to sign-in / start-trial. Redeem on a public deal may prompt sign-in.
- **Visible-but-locked:** premium surfaces render a locked state that doubles as the upsell
  (Going's Watchlist pattern; DealFinder's existing `UpsellNudge`/locked feed). Never hide them.
- **Phase-B feature-gating seam (build now, off by default):** a single config map, e.g.
  `webFeatureGates` (per route/surface: `full` | `app-redirect`), read by `AppShell`. In Phase A
  every surface is `full`. In Phase B, flipping a surface to `app-redirect` renders a "continue in
  the app" interstitial instead of the feature — letting us replicate Going's install-driving
  strategy later **without** touching the screens. Document this seam in code so it isn't mistaken
  for current behavior.
- **"Get the app" slot:** reserve one optional, low-key placement (e.g. footer + an account-menu
  item), flag-controlled and **off/minimal in Phase A** — explicitly *not* Going's persistent
  purple wall, per §2 and the design system's calm tone.

## 8. Signed-out / Anonymous web (detailed spec)

This section consolidates the anonymous experience that §3–§7 reference, and specifies the
landing page, the public-deal teaser, and the auth entry flow in detail. It applies to any
visitor with no active session, at both breakpoints. The job of every signed-out surface is to
**demonstrate value and earn trust, then convert to sign-up / start-trial** — never to wall off
value behind a login it hasn't justified.

> Trust-first framing (CLAUDE.md hard rule 6 + design system "calm, credible, not a coupon
> site"): DealFinder asks to read the user's inbox, so the signed-out story leads with the
> read-only / privacy / payout-blind promise, not a "save 90%" shout.

### 8.1 Entry & routing rules
- **`/` (root):** anonymous → the **marketing landing** (§8.2). Authenticated → redirect to
  `/feed` (mirrors Going's `going.com → /deals`). One source of truth: the `AppShell` reads the
  auth flag in `DemoContext`.
- **Public routes (no auth):** `/` , `/feed` (All Deals only), `/deal/:id` (view), `/trial`,
  `/paywall` (preview/pricing), `/signin`, auth callbacks, and all footer/legal/help pages.
- **Gated routes (anonymous → intercept):** `/feed` For You tab, `/watches`, `/savings`,
  `/brands`, `/chat`, `/connect`, `/enroll`, `/scan`, `/summary`, `/settings`, `/privacy`.
  Hitting one while signed out renders a **sign-in / start-trial interception** (§8.5) with a
  `returnTo` so the user lands back where they intended after auth.
- **Deep links are honored:** an anonymous visitor opening a shared `/deal/:id` sees the full
  public deal detail (this is the viral/share path Going leans on), with a contextual sign-up
  nudge — not a hard wall.

### 8.2 Marketing landing (`/`) — content spec
A single responsive page; sections stack on mobile, become multi-column / wider on desktop.
Reuse `ValueExplainer` copy where it fits; author desktop hero treatments as needed.

1. **Top nav** — logo · Deals · How it works · (Pricing) · **Log in** · **Start free trial**
   (apricot accent). Mobile: logo · ☰ drawer containing the same links + auth CTAs.
2. **Hero** — trust-first headline (e.g. "An agent that finds your deals — and never sells your
   rank"), one-line subhead naming the mechanism (reads your inbox, read-only), primary CTA
   **Start free trial**, secondary **Browse deals** (→ public feed, no signup). No fake urgency.
3. **How it works** — 3 steps: connect inbox (read-only) → we scan & rank payout-blind → you
   redeem and track savings. Each step states the trust guarantee inline.
4. **Proof / value** — the "we found you $X" framing and a few representative (public) deal
   cards; concrete numbers per the design system ("always show the number").
5. **Trust block** — explicit, prominent: read-only access, disconnect/delete anytime,
   **brands never pay to rank higher**, what we can / can't see (the PermissionSheet promise,
   previewed before signup).
6. **Pricing teaser** — free vs premium (trial), annual price framed as a small monthly number,
   "no charge for N days" → `/paywall` / `/trial`. Calm urgency only (no countdown wall).
7. **Footer** — the shared global footer (§4): How it works · Privacy · Terms · Help · trust
   line · © DealFinder. This is the anonymous IA safety net.

### 8.3 Public deals teaser (`/feed`, All Deals, signed out)
- Anonymous users get the **All Deals** (public, non-personalized) feed — the free-path catalog
  owned by `FREE_PATH_PRD.md` — rendered in the responsive grid (§6): 1 col mobile, 2 tablet,
  3 desktop.
- **Decision (recommended default): show real value, gate personalization.** Display the full
  public catalog (or a generous set), clearly labeled "Public deals", with a persistent inline
  banner: "Connect your inbox and we'll find deals just for you — free for N days." The **For
  You** tab is visible but **locked** (visible-but-locked, §7) → start-trial.
- Filters/sort work for anonymous users (client-side over public deals), same inline-vs-sheet
  reflow as signed-in (§6) — so the experience already feels like the product.
- Each public `DealCard` → `/deal/:id` (public detail). No payout/sponsored treatment, ever.
- *(Alternative, behind a flag: cap the teaser at N cards then a "sign in to see all" nudge —
  left as an open question in §12; default is uncapped to maximize demonstrated value.)*

### 8.4 Public deal detail (`/deal/:id`, signed out)
- Full deal content per `CORE_FEED_PRD.md` §4.4 (savings $/%, price comparison, grade, "why
  this is a good deal", terms, payout-blind trust line) — desktop two-column / mobile single
  (§6).
- **Redeem prompts auth:** tapping the sticky CTA (copy code / book / open) for an anonymous
  user opens the sign-in / start-trial interception (§8.5) with `returnTo` set to this deal, so
  the code copy / booking completes immediately after auth. Copy-to-clipboard of a *public* code
  may be allowed without auth (decide in §12); tracked redemption/savings always requires auth.
- **Share** is available to anonymous users (the deep-link/virality path).

### 8.5 Auth entry flow (sign-in / sign-up / start-trial)
- **Surfaces:** `/signin` (and the start-trial path via `/trial`). Real auth is Supabase
  (`lib/supabase.ts`, `/auth/callback`); in the prototype, demo controls toggle the session.
- **Interception pattern:** anonymous user hits a gated action/route → a centered modal/card
  (desktop) or full-screen sheet (mobile) offering **Continue with email / Google** and a clear
  **Start free trial** option, carrying `returnTo`. After success → resume the original
  intent (open the deal, start the scan, view watches).
- **Sign-up = start-trial entry:** new users are funneled into the trial/onboarding chain
  (`ONBOARDING_PRD.md`: Meet Scout → Connect Email → Enrollment Consent → First Scan → Summary).
  The Connect-Email step restates the read-only promise (PermissionSheet) before any OAuth.
- **Credential handling stays compliant:** the web app never asks Claude/automation to enter
  passwords; standard provider auth only. No account creation or credential entry is performed
  on the user's behalf.
- **Returning users:** Log in → restore session → `/feed` (or `returnTo`).

### 8.6 Signed-out states to build (checklist)
For **desktop and mobile** each: marketing landing (all sections, responsive); public All-Deals
feed (populated, loading, empty, filtered); locked "For You" upsell; public deal detail (each
`redeemType`, redeem→auth interception, missing-deal); auth modal/sheet (email + provider,
error, `returnTo` resume); gated-route interception with return; footer/legal/help pages; nav in
signed-out form (top-bar Log in/Start-trial; mobile drawer). Accessibility: keyboard-navigable
auth, focus states, 44px targets, no hover-only affordances.

### 8.7 Signed-out success metrics
- Landing → Start-trial / sign-up conversion; landing → Browse-deals engagement.
- Public feed → deal-detail tap-through (anonymous); shared-deal-link → sign-up.
- Redeem-intent → auth-completion rate (does the interception convert or leak?).
- Trust-block engagement; no drop in payout-blind trust signal for anonymous users.

## 9. Prototype vs real-webapp layering

- **Prototype (now):** all mock data, client-side. "Signed-out vs signed-in" can be driven by the
  existing demo controls (`DemoMenu`) plus the extended `DemoContext` flag; no real auth needed to
  demo the four cells. Deliver the responsive shell, desktop layouts, footer, and reflows against
  the current mock JSON.
- **Real webapp (forward-looking):** signed-in/out backed by real Supabase auth
  (`lib/supabase.ts`, `/auth/callback` already scaffolded); entitlement from real subscription
  state; gates enforced server-side as well as in the shell. The responsive shell and gating seam
  are auth-source-agnostic — they read `DemoContext`/session, so the mock→real swap doesn't touch
  layout. Matches the seam philosophy in `CORE_FEED_PRD.md` §6 and `WEBAPP_MIGRATION_BUILD_PLAN.md`.

## 10. States to build (checklist for Cowork)

For **each** of the four matrix cells (signed-out/in × desktop/mobile), verify:
- App shell renders the correct nav (top+rail / bottom+drawer), tier badge, and footer.
- Feed: grid column count per breakpoint; Staff-picks/For-You rail; filter inline-vs-sheet; empty,
  loading, locked (free), and error states.
- Deal Detail: single-column mobile vs two-column desktop with sticky redeem sidebar; each
  `redeemType`; pre/post redeem; missing-deal.
- Gated surfaces (watches, savings, brands, scan): locked-upsell for free/anonymous; full for
  premium; sign-in prompt for anonymous.
- Onboarding/paywall/connect/settings: full-screen (mobile) vs modal/centered (desktop); trust
  copy intact.
- Auth: sign-in / sign-up entry from both nav presentations; signed-out → gated route → auth →
  return.
- Phase-B seam: with a surface flag set to `app-redirect`, the interstitial renders correctly and
  reverts cleanly to `full` (regression guard so Phase A stays full-featured).
- Accessibility: keyboard nav, focus states, contrast, 44px touch targets, no reliance on hover.

## 11. Success metrics

- Desktop web usability: bounce/again-rate on desktop vs the old phone-framed build; desktop
  feed→deal tap-through; redeem completion on desktop.
- Cross-breakpoint parity: zero capabilities reachable on mobile web but missing on desktop web
  (and vice versa) — tracked as a parity checklist, not just analytics.
- Signed-out → trial conversion from the new marketing landing + public-deal teaser.
- No regression in the payout-blind trust signal at any breakpoint.

## 12. Open questions

- Desktop primary nav: **top-bar-only** vs **top-bar + left rail app shell**? (Both meet parity;
  rail reads more "app", top-bar reads more "site".)
- Does the signed-out landing reuse the current `ValueExplainer` content responsively, or do we
  author a dedicated desktop marketing hero (trust-first: "an agent that reads your inbox, never
  sells your rank")?
- Should public (signed-out) users see the **full** All-Deals catalog or a capped teaser before a
  sign-in nudge? (Going shows deals but gates tracking; we lean "show value, gate personalization".)
- For a public deal, can an anonymous user **copy the promo code** without auth (value-first), or
  does any redeem action require sign-in? (Default leans: allow public code copy, gate tracked
  redemption/savings — see §8.4.)
- Phase-B: which surfaces would we *first* withdraw from web to push installs, if/when we do —
  and should that decision live in this PRD or a future `APP_INSTALL_STRATEGY.md`?
- Keep `PhoneFrame` as an opt-in demo preview, or retire it entirely once the shell ships?
