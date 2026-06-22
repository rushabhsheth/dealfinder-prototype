# DealFinder server

Real-webapp backend (Phase 0). Fastify + TypeScript + Supabase. Owns user
accounts, entitlements, OAuth tokens, and the brand/offer/savings data; the
Gmail scan + extraction pipeline lands in Phase 1–2.

Governed by `../CLAUDE.WEBAPP.md` and `../plans/GMAIL_KICKOFF.md`. The frontend
lives in `../app/` (a fork of `../prototype/`, which stays frozen).

## Layout

```
server/
  src/
    index.ts            process entry (listen + graceful shutdown)
    app.ts              builds the Fastify instance (testable, no port bind)
    config.ts           typed, validated env (zod) — fails fast
    db/
      supabase.ts       adminDb (service-role) + authClient (anon)
      migrations/0001_init.sql   full schema (users, entitlements,
                                 oauth_connections, brands, offers, savings)
    crypto/tokens.ts    AES-256-GCM encrypt/decrypt for OAuth tokens
    auth/
      middleware.ts     requireUser — verifies Supabase bearer JWT
      routes.ts         /auth/signup, /auth/signin, /auth/me
    routes/health.ts    /health, /ready
    types/domain.ts     API types aligned with app/src/types.ts
  docs/
    SCHEMA.md           tables, relationships, RLS, provisioning
    OAUTH_TOKEN_STORAGE.md   how tokens are encrypted + where the key lives
    AUTH_FLOW.md        sign-up / sign-in / me flow
```

## Setup

```bash
cd server
npm install
cp .env.example .env          # then fill in values
npm run gen:key               # → paste into TOKEN_ENCRYPTION_KEY
```

Fill `.env` with your Supabase project URL + anon + service-role keys. Apply the
schema: paste `src/db/migrations/0001_init.sql` into the Supabase SQL editor (or
`supabase db push`).

## Run

```bash
npm run dev        # tsx watch, http://localhost:8787
npm run typecheck  # tsc --noEmit
npm run build      # → dist/
```

Smoke test:

```bash
curl localhost:8787/health
curl -X POST localhost:8787/auth/signup -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"supersecret"}'
```

## Hard rules (from CLAUDE.WEBAPP.md)

- **No secrets in the repo** — only `.env.example` is committed; `.env` is ignored.
- **OAuth tokens encrypted at rest, server-only** — never returned by any API.
- **Read-only Gmail scope only** (`gmail.readonly`) when Phase 1 lands.
- **Data minimization** — store structured offers + sender metadata, not raw
  email bodies.
- **Payout-blind ranking** — ranking never uses any affiliate/commission signal.

## Status

Phase 0 complete: schema + migrations, encrypted-token design, minimal auth,
typed config, health checks. **Gmail OAuth is not wired yet** — that's Phase 1.
