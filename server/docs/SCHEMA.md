# Database schema (Phase 0)

Managed Postgres on Supabase. Source of truth: `supabase/migrations/20260622170000_init.sql`
(idempotent — safe to re-run). CLI usage: `supabase/README.md`.
Enums mirror `app/src/types.ts` so the API and frontend share one vocabulary.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Public mirror of `auth.users`. `id` **is** the Supabase auth user id. | `id` (PK→auth.users), `email` |
| `entitlements` | Premium gating (scan, auto-enroll, brands, ranking, watch). One row per user. | `tier` (`free`/`trial`/`paid`), `trial_ends_at`, `downgraded` |
| `oauth_connections` | **Encrypted** Google OAuth tokens, server-only. Read-only scopes. | `access_token_ciphertext`, `refresh_token_ciphertext`, `scopes[]`, `status` |
| `brands` | Enrolled Brands ledger — one row per promo sender per user. | `source` (`enrolled`/`detected`), `status`, `sender_domain`, `can_one_click_unsubscribe` |
| `offers` | Structured extracted offers (mirrors frontend `Deal`). No raw bodies. | `brand_id`, `dedup_hash` (unique per user), `source_message_id` |
| `savings` | Realized-savings ledger feeding Savings Summary + per-brand totals. | `offer_id`, `brand_id`, `amount_saved` |

## Relationships

```
auth.users 1───1 users 1───1 entitlements
                   │
                   ├──< oauth_connections   (a user may connect >1 provider/account)
                   ├──< brands ──< offers ──< savings
                   └──< (offers, savings also reference user_id directly)
```

`offers.brand_id` and `savings.brand_id/offer_id` are `ON DELETE SET NULL` so
deleting a brand/offer never silently drops a user's realized-savings history.
`user_id` foreign keys are `ON DELETE CASCADE`: deleting the account purges
everything (the "delete my data" path).

## Enums (= `app/src/types.ts` unions)

`deal_tier_t`, `deal_category_t`, `redeem_type_t`, `brand_source_t`,
`brand_status_t`, `entitlement_tier_t`, `oauth_provider_t` (`google` only for
now), `connection_status_t`.

## Row-Level Security

RLS is enabled on every user-owned table.

- `users`/`entitlements`/`brands`/`offers`/`savings`: a row is **selectable**
  only when `user_id = auth.uid()` (or `id = auth.uid()` for `users`).
- **No write policies for the anon role** — only the backend (service-role key)
  mutates these. Token storage, enrollment, and scan writes can't be forged from
  a browser.
- `oauth_connections`: **zero policies** → deny-all for anon. Tokens and
  connection metadata are server-only, full stop.

The backend uses the service-role key (RLS-exempt) for trusted work; RLS is
defense-in-depth against a leaked anon key.

## New-user provisioning

A `SECURITY DEFINER` trigger `on_auth_user_created` fires after every
`auth.users` insert: it mirrors the row into `public.users` and creates a
default `free` entitlement. So a signed-up user always has both rows without the
API doing extra writes.

## Applying

With the Supabase CLI (preferred — see `supabase/README.md`):

```bash
supabase link --project-ref <ref>
supabase db push
```

Or paste `supabase/migrations/20260622170000_init.sql` into the Supabase SQL
editor. The migration is idempotent, so re-running after a partial apply is safe.
