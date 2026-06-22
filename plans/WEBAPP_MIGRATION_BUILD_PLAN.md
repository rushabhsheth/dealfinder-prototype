# DealFinder — Real Webapp Migration Build Plan

Phased plan to take the prototype (`app/`) to a real webapp, **starting with inbox
scanning** and shipping **Enrolled Brands** as the first real feature. Governed by
`CLAUDE.WEBAPP.md`; feature spec in `plans/ENROLLED_BRANDS_PRD.md`.

## Guiding principle
Build **one vertical slice end to end** before breadth: a real OAuth connection that scans
a real inbox, extracts a few offers, and renders them in the existing feed + Enrolled
Brands. That retires the riskiest questions (Can we get the scopes? Does extraction work?
Is the trust story real?) before we widen coverage.

---

## Phase 0 — Backend foundation & safety rails
- Stand up `server/` (Node + TS, Fastify/Express), Postgres, and a job queue (Redis/BullMQ).
- Schema: `users`, `oauth_connections` (encrypted tokens), `entitlements`, `brands`,
  `offers`, `savings`. Migrations in `server/db`.
- Secrets management (no secrets in repo), TLS, encryption at rest for tokens.
- Minimal real auth (sign in) + session/JWT.
- **Done when:** a signed-in user record exists and the server boots with a clean schema.

## Phase 1 — Real inbox connection (the trust-critical slice)
- Google OAuth with **`gmail.readonly`** only; Microsoft Graph **`Mail.Read`** for Outlook.
- Replace the mocked Connect Email (Screen 5) with the **real OAuth handshake**, keeping the
  existing plain-language permission UI and "what we can/can't see" framing.
- Store tokens server-side, encrypted; implement **disconnect** (revokes + purges).
- **Done when:** a user connects a real Gmail/Outlook account read-only and can disconnect.

## Phase 2 — Scanning & extraction pipeline
- Background worker: pull promo messages → promo classifier → LLM structured extraction →
  dedup/normalize → write `offers` linked to `brands`. Store structured data, not raw bodies.
- Detect promo **senders** during the scan → create `brands` rows with `source: "detected"`.
- First Scan (Screen 7) and Savings Summary (Screen 8) driven by **real** extraction output.
- **Done when:** connecting an inbox produces real offers in the feed and a real savings
  summary.

## Phase 3 — Auto-enrollment (real)
- From the interest survey + agent picks, actually subscribe the user to selected
  newsletters → create `brands` rows with `source: "enrolled"`.
- Wire Enrollment Consent (Screen 6) to the real enrollment action.
- **Done when:** confirmed brands in consent show up as `Enrolled · Active` and start
  delivering offers.

## Phase 4 — Enrolled Brands surface  ⭐ (this phase's headline)
- Add `EnrolledBrand` types (`app/src/types.ts`) and the data-access layer
  (`getEnrolledBrands`, `pauseBrand`, `unsubscribeBrand`, `reEnrollBrand`).
- Build **`EnrolledBrands.tsx`** at route `/brands`; add the **"Enrolled Brands"** item to
  `HeaderMenu.tsx`; gate on entitlement.
- Implement: summary strip, sortable/filterable brand list, brand detail sheet, and the
  three controls. **Unsubscribe is real** (RFC 8058 `List-Unsubscribe` / provider path).
- States: loading skeleton, empty, locked (free/downgraded), error/retry.
- Replace the dangling "manage subscriptions in Settings" copy with a deep link to `/brands`.
- **Done when:** a user sees every enrolled + detected brand, pauses one, and truly
  unsubscribes from another, with savings/deal counts per brand.

## Phase 5 — Entitlements, ranking & data-layer cutover
- Entitlement service gates scan/enroll/personalization/brands/watch; trial-expiry triggers
  the graceful downgrade (PRD §4.3) and pauses scanning.
- Move ranking server-side (relevance + savings + urgency, **payout-blind**).
- Cut the premium screens over from mock JSON to the real API (keep mock behind a demo flag).
- **Done when:** the real premium loop runs on live data, and downgrade locks it cleanly.

## Phase 6 — Compliance & launch readiness
- Google restricted-scope verification + **CASA** prep; Microsoft review; privacy
  disclosures; data-deletion tooling verified.
- Load/cost review of scanning; rate limits; observability on the pipeline.
- Web billing (Stripe) wired to entitlements for real subscriptions.
- **Done when:** the app can onboard real users within verified scopes and bill them.

---

## Out of scope (this migration)
- Native apps + App/Play Store IAP (web app only).
- Auto-booking; live fare APIs (travel watch stays mocked until a fares phase).
- UGC deal posting; international/non-USD.
- Manual "add any brand" (P2 — sub-PRD §9).

## Suggested first prompt to Claude Code
> Read `CLAUDE.WEBAPP.md`, `plans/ENROLLED_BRANDS_PRD.md`, and this plan. Do **Phase 0**:
> scaffold the `server/` backend (Node + TS + Fastify), Postgres schema and migrations for
> users / oauth_connections / entitlements / brands / offers / savings, the job queue, and
> minimal auth — with encrypted token storage and no secrets in the repo. Then stop and
> show me the schema and how OAuth tokens will be stored before we wire Phase 1.
