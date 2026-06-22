# DealFinder — Gmail-First Webapp Kickoff (for Claude Code)

A focused, **Gmail-only** starting plan for turning the prototype into a real webapp.
This narrows the broader `WEBAPP_MIGRATION_BUILD_PLAN.md` to the single slice you want to
ship first: **real Gmail promotions → real offers in the feed**. It also fixes a few
things in the older plan that don't match the current repo.

Governed by `CLAUDE.WEBAPP.md`. Read that file first — its hard rules (read-only scopes,
server-side tokens, data minimization, payout-blind ranking, entitlements) still apply.

---

## Read these before starting (in order)
1. `CLAUDE.WEBAPP.md` — standing rules for the real app (supersedes the prototype's
   mock-only rule).
2. `plans/ENROLLED_BRANDS_PRD.md` — the first feature surface.
3. `PRDs/DealFinder_PRD.docx` §7 (extraction) and §8 (privacy/compliance).
4. This file.

---

## Corrections to the older plan (apply these — don't trust the stale paths)
- **The frontend is in `prototype/`, not `app/`.** Everywhere `WEBAPP_MIGRATION_BUILD_PLAN.md`
  and `CLAUDE.WEBAPP.md` say `app/`, read it as `prototype/`. Either keep working in
  `prototype/` or rename it to `app/` in one explicit commit first — pick one and say which.
- **Outlook is out of the first slice.** The old Phase 1 covers Gmail *and* Microsoft Graph.
  Do **Gmail only** now. Keep the provider abstraction (an `EmailProvider` interface) so
  Outlook drops in later, but don't implement it yet.
- **There is no data-access layer yet.** Screens import mock JSON directly through
  `prototype/src/lib/data.ts`. The "call `getDeals()` instead of importing JSON" seam in
  the old plan still needs to be built — treat it as work, not a given.
- **The relevant UI already exists as mock shells:** `ConnectEmail.tsx`, `FirstScan.tsx`,
  `SavingsSummary.tsx`, `EnrolledBrands.tsx`, `Feed.tsx`, `DealDetail.tsx`. Evolve these to
  call real endpoints — don't rebuild them.

---

## Recommended stack (my pick, since you asked me to choose)

For a solo prototype-to-MVP, go **lean managed services** rather than self-hosting
Postgres + Redis. It gets you to a working Gmail slice fastest and keeps the safety rules
in `CLAUDE.WEBAPP.md` satisfiable:

- **Backend:** Node + TypeScript with **Fastify** (small, typed, fast). Lives in `server/`.
- **Database + Auth:** **Supabase** (managed Postgres + built-in auth + row-level security).
  Auth gives you real accounts without building session/JWT plumbing from scratch.
- **Background jobs:** start with a simple in-process queue or **Supabase scheduled
  functions / a single worker process**; only add Redis/BullMQ if scan volume demands it.
  Scanning must still be async (not request-bound).
- **Secrets:** environment variables via the host's secret store (e.g. Vercel/Render env
  vars or a `.env` that is **git-ignored**). **No secrets, no Google client secret, no
  tokens in the repo or in client code** — hard rule.
- **LLM extraction:** Anthropic API (server-side only) for structured offer extraction.
- **Hosting:** frontend on Vercel; backend on Render/Fly/Railway (or Vercel functions if
  the worker stays light).

> Tradeoff: the alternative is the from-scratch **Node + self-managed Postgres + Redis/BullMQ**
> stack described in `WEBAPP_MIGRATION_BUILD_PLAN.md`. That's more control and no vendor
> lock-in, but more setup and ops for a one-person MVP. The plan below is written so either
> choice works — only Phase 0's provisioning differs. If you prefer the custom stack, tell
> Claude Code to swap Supabase for self-hosted Postgres + a JWT/session auth module.

---

## The Gmail-first slice (what "done" looks like)
A real user signs in, connects their Gmail **read-only**, we scan promotional mail, extract
structured offers, and they appear as real cards in the existing feed — with a working
**disconnect inbox** that purges their data. Outlook, auto-enroll, travel watch, and billing
come later.

### Phase 0 — Backend foundation & safety rails  ← **START HERE, then stop**
- Scaffold `server/` (Fastify + TS). Health check route; typed config loaded from env.
- Provision Supabase; define schema + migrations for:
  `users`, `oauth_connections` (encrypted Google tokens), `entitlements`,
  `brands`, `offers`, `savings`.
- Token handling: store Google refresh/access tokens **encrypted at rest, server-side
  only**; document exactly how (which column, which encryption, where the key lives).
- Minimal real auth (Supabase auth or a minimal email sign-in) producing a real user row.
- Secrets management wired (env, git-ignored) — verify nothing sensitive is committed.
- Share the **shared types**: add backend offer/brand types that line up with
  `prototype/src/types.ts` (`Deal`, `EnrolledBrand`, `BrandSource`, `BrandStatus`).
- **Stop and show me:** the schema, the OAuth-token storage design, and the auth flow —
  before wiring any Gmail calls.

### Phase 1 — Real Gmail connect (read-only)
- Google OAuth with **`gmail.readonly` only** — never request write/send/modify.
- Replace mocked `ConnectEmail.tsx` with the real handshake; keep the existing plain-language
  "what we can / can't see" consent UI.
- Tokens stored server-side encrypted; **disconnect** revokes the grant **and purges**
  stored data.
- Done when: a real Gmail account connects read-only and can fully disconnect.

### Phase 2 — Scan & extraction pipeline
- Background worker: pull promo messages → classify promo vs. not → LLM structured
  extraction → dedup/normalize → write `offers` linked to `brands`.
- **Store structured offers + sender metadata, not raw email bodies** (data minimization).
- Detect promo **senders** during the scan → create `brands` rows with `source: "detected"`.
- Drive `FirstScan.tsx` and `SavingsSummary.tsx` from **real** extraction output.
- Done when: connecting an inbox produces real offers in the feed + a real savings summary.

### Phase 3 — Data-layer cutover + Enrolled Brands (read)
- Build the data-access seam in `prototype/src/lib/`: `getDeals()`, `getEnrolledBrands()`,
  backed by real API calls, with the **mock implementation kept behind an env flag** for
  demos/tests.
- Wire `EnrolledBrands.tsx` (`/brands`) to real detected brands; show savings/deal counts.
  (Pause / real unsubscribe via RFC 8058 `List-Unsubscribe` can follow.)
- Required real states everywhere mailbox-backed: **loading, empty, error/retry, locked**.
- Done when: premium screens render live Gmail-derived data through the data layer.

> Auto-enroll, entitlement gating + trial-expiry downgrade, server-side ranking, Outlook,
> travel watch, and Stripe billing are explicitly **later phases** — see
> `WEBAPP_MIGRATION_BUILD_PLAN.md`.

---

## Compliance to keep in view from day one (PRD §8)
- Production Gmail beyond 100 users requires **Google restricted-scope verification + CASA**
  (annual, non-trivial). Design now to pass: least scope, clear in-app consent, real data
  deletion, minimal retention.
- Keep ranking **payout-blind** — no signal from any affiliate/commission, ever. No
  "sponsored ranks higher" UI.

---

## Copy-paste first prompt for Claude Code

> Read `CLAUDE.WEBAPP.md`, `plans/GMAIL_KICKOFF.md`, and `plans/ENROLLED_BRANDS_PRD.md`.
> Note the corrections in GMAIL_KICKOFF.md: the frontend is in `prototype/` (not `app/`),
> we are doing **Gmail only** for now (no Outlook), and there is no data-access layer yet.
>
> Do **Phase 0 only**, then stop. Using the recommended lean stack (Fastify + TypeScript in
> `server/`, Supabase for managed Postgres + auth):
> 1. Scaffold `server/` with a health-check route and typed env-based config.
> 2. Write the Supabase schema + migrations for `users`, `oauth_connections`,
>    `entitlements`, `brands`, `offers`, `savings`.
> 3. Design encrypted, server-side-only storage for Google OAuth tokens and document it.
> 4. Stand up minimal real auth producing a user row.
> 5. Add backend types aligned with `prototype/src/types.ts`. Ensure no secrets are
>    committed (env, git-ignored).
>
> Then **stop** and show me: the schema, the OAuth-token storage design, and the auth flow,
> before we wire any Gmail API calls in Phase 1. Do not request any Gmail scope beyond
> `gmail.readonly` when we get there.
