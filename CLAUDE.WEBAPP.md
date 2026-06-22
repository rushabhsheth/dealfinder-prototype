# CLAUDE.WEBAPP.md — DealFinder Real Webapp

Standing instructions for Claude Code for the **real webapp migration**. Read this before
every task in this workstream.

> **Status & precedence.** The root `CLAUDE.md` governs the *mock prototype* and its
> hard rule is "mock data only, no backend." That phase is done. **For all real-webapp
> work, this file supersedes the prototype's mock-only / no-backend / no-OAuth rules.**
> When you begin the migration, promote this file to be the active `CLAUDE.md` (or place a
> copy at the root of each new subtree — `app/`, `server/`). Keep the old prototype rules
> only where you are still working purely on demo UI.

## What we're building
Turning the DealFinder clickable prototype (`app/`) into a **real, production-track web
application**, starting with **real inbox scanning** and the **Enrolled Brands** surface
(see `plans/ENROLLED_BRANDS_PRD.md`). The product remains the freemium AI savings agent
from `PRDs/DealFinder_PRD.docx`: free open-deals tier + premium agent (inbox scan,
auto-enroll, personalized ranking, one-tap redeem).

First real milestone (the slice that proves the architecture): a user connects Gmail or
Outlook read-only → we detect/enroll promo brands → extract offers → surface them in the
existing feed → manage senders in **Enrolled Brands**. Build this end to end before
breadth.

## Hard rules
1. **Real integrations, done safely.** Real Gmail/Outlook OAuth using **read-only
   restricted scopes** (`gmail.readonly`; Microsoft Graph `Mail.Read`). Never request
   write/send/modify scopes. The **only** outbound mail action permitted is the
   user-initiated standardized unsubscribe (RFC 8058 `List-Unsubscribe`); nothing sends
   mail *as* the user.
2. **Security & secrets are first-class.** No secrets, tokens, or client secrets in the
   repo or in client code. OAuth tokens are stored server-side, encrypted at rest;
   everything over TLS. All inbox access happens on the backend, never in the browser.
   Least-privilege everywhere.
3. **Data minimization (PRD §8).** Store **structured offers and sender metadata**, not raw
   email bodies, wherever possible. Retain the minimum needed to extract and dedup offers.
   Provide working **disconnect inbox** and **delete my data** paths from day one — they
   must actually purge.
4. **Trust is the brand.** Ranking is **never** influenced by payout — keep ranking
   strictly independent of any affiliate/commission signal. No "sponsored ranks higher"
   UI, ever. Unsubscribe/pause have **no dark patterns**: one tap, always visible, plain
   copy.
5. **Entitlements gate every premium capability.** Inbox scan, auto-enroll,
   personalization, Enrolled Brands, travel watch are premium (trial or paid). On trial
   expiry without conversion, premium locks and scanning pauses — the graceful downgrade
   (PRD §4.3). The free open-deals feed never needs an inbox.
6. **Follow the existing design system.** Reuse `plans/DESIGN_SYSTEM.md` tokens and the
   existing components (`DealCard`, `PhoneFrame`, `PrimaryButton`, `BottomNav`, badges).
   New screens match the calm, credible look. Don't hardcode hex; use the Tailwind tokens.
7. **Keep the frontend honest about real state.** Loading, empty, error, and locked states
   are required for anything backed by a live mailbox — network calls fail, scans take
   time. No optimistic UI that can silently lie.

## Tech stack
- **Frontend:** the existing **React + Vite + TypeScript + Tailwind** app in `app/`.
  Routing `react-router`, icons `lucide-react`. Evolve it — don't rewrite it.
- **Backend (new):** Node + TypeScript API (Fastify or Express). Talks to Gmail API /
  Microsoft Graph; runs the extraction pipeline; owns OAuth tokens, entitlements, and the
  brand/offer/savings data.
- **Datastore:** Postgres (offers, brands, users, entitlements, savings). A queue/worker
  for background scans (e.g. BullMQ/Redis) — scanning is async, not request-bound.
- **Extraction:** ingestion → promo classifier → LLM structured extraction → dedup/
  normalize → offer store (PRD §7). Keep extraction server-side.
- **Auth:** real user accounts (start minimal — email/OAuth sign-in); session/JWT.
- **Billing:** entitlement service abstracted now; real billing wired later (web billing
  via Stripe for the webapp — IAP is the native-app concern, out of scope here).

## Repo layout (target)
- `app/` — React frontend (exists). Add an API client layer; **stop importing mock JSON**
  for premium data once endpoints exist (keep mocks behind a flag for demos/tests).
- `server/` — new backend: `routes/`, `services/` (gmail, outlook, extraction, ranking,
  entitlements), `db/` (schema + migrations), `workers/` (scan jobs), `auth/`.
- `plans/` — `DESIGN_SYSTEM.md`, `SCREENS.md`, `ENROLLED_BRANDS_PRD.md`,
  `WEBAPP_MIGRATION_BUILD_PLAN.md`.
- `PRDs/` — source requirements.

## Migration conventions
- **Replace mock data behind an interface, don't delete it.** Define a data-access layer in
  `app/src/lib` so screens call `getDeals()`/`getEnrolledBrands()` rather than importing
  JSON. Back it with real API calls; keep a mock implementation toggled by env for demos.
- One screen per file (matches `plans/SCREENS.md`). New: `EnrolledBrands.tsx`, route
  `/brands`, entry in `HeaderMenu.tsx`.
- Money always USD; show `$` and `%` where the PRD journeys imply both.
- Every new backend endpoint: typed request/response shared with the frontend types in
  `app/src/types.ts` (add `EnrolledBrand`, `BrandSource`, `BrandStatus`).
- Write tests for the extraction and entitlement logic — these are correctness-critical.

## Compliance to resource from day one (PRD §8)
- **Google restricted-scope verification + CASA** is required for production Gmail beyond
  100 users (annual recert; non-trivial cost). Design to pass it now: least scope, clear
  in-app consent, data deletion, minimal retention. Microsoft has an analogous review.
- Clear privacy disclosures; consent-based auto-enrollment with trivial unsubscribe
  (CAN-SPAM optics).

## Explicitly OUT of scope (this phase)
- Native iOS/Android apps and App/Play Store IAP (this is the **web** app).
- Auto-booking travel; live fare APIs (still mock the watch + alert until a fares phase).
- Community/UGC deal posting.
- International / non-USD.
- Manual "add any brand" enrollment (P2 — see sub-PRD §9).

## Where to look
- `PRDs/DealFinder_PRD.docx` — product source of truth.
- `plans/ENROLLED_BRANDS_PRD.md` — first feature spec for this phase.
- `plans/WEBAPP_MIGRATION_BUILD_PLAN.md` — phased plan + suggested first prompt.
- `plans/DESIGN_SYSTEM.md`, `plans/SCREENS.md` — visual language and screen flow.
