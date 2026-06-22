-- DealFinder — initial schema (Phase 0)
-- Managed Postgres on Supabase. Apply via the Supabase SQL editor or CLI:
--   supabase db push   (or paste into the SQL editor)
--
-- Design notes:
--  * Enums mirror app/src/types.ts so the API and the frontend speak one vocabulary.
--  * Every user-owned table has Row-Level Security so a leaked anon key can only
--    ever touch the caller's own rows. The backend uses the service-role key,
--    which bypasses RLS for trusted server work (scan worker, token storage).
--  * Data minimization (PRD §8): we store STRUCTURED offers + sender metadata,
--    never raw email bodies. offers.source_message_id is just an opaque Gmail id
--    used for dedup/idempotency.
--  * OAuth tokens are stored ENCRYPTED (AES-256-GCM) in oauth_connections; the
--    encryption key lives only in the server env, never in this database.

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Enums (match app/src/types.ts) ──────────────────────────────────────────
do $$ begin
  create type deal_tier_t as enum ('public', 'personalized');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deal_category_t as enum ('travel', 'retail', 'dining', 'tech');
exception when duplicate_object then null; end $$;

do $$ begin
  create type redeem_type_t as enum ('code', 'book', 'link');
exception when duplicate_object then null; end $$;

do $$ begin
  create type brand_source_t as enum ('enrolled', 'detected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type brand_status_t as enum ('active', 'paused', 'unsubscribed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entitlement_tier_t as enum ('free', 'trial', 'paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type oauth_provider_t as enum ('google'); -- 'microsoft' added in a later phase
exception when duplicate_object then null; end $$;

do $$ begin
  create type connection_status_t as enum ('active', 'revoked');
exception when duplicate_object then null; end $$;

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── users ───────────────────────────────────────────────────────────────────
-- Public mirror of auth.users. One row per real account; the id IS the Supabase
-- auth user id, so auth.uid() ties straight through to ownership everywhere.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function set_updated_at();

-- ── entitlements ────────────────────────────────────────────────────────────
-- Drives premium gating (scan, auto-enroll, Enrolled Brands, ranking, watch).
-- One row per user. Trial expiry without conversion → downgraded = true and the
-- graceful downgrade kicks in (PRD §4.3); scanning pauses.
create table if not exists public.entitlements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.users(id) on delete cascade,
  tier             entitlement_tier_t not null default 'free',
  trial_started_at timestamptz,
  trial_ends_at    timestamptz,
  downgraded       boolean not null default false,
  -- Billing fields wired in a later phase (Stripe). Present so the shape is stable.
  billing_period_end timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function set_updated_at();

-- ── oauth_connections ───────────────────────────────────────────────────────
-- Encrypted Google OAuth tokens, SERVER-SIDE ONLY. Read-only scopes only
-- (gmail.readonly). Tokens are AES-256-GCM ciphertext envelopes — see
-- docs/OAUTH_TOKEN_STORAGE.md. Disconnect sets status='revoked' and the app
-- purges derived data.
create table if not exists public.oauth_connections (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  provider                 oauth_provider_t not null default 'google',
  provider_account_id      text,                 -- Google 'sub'
  provider_account_email   text,                 -- the connected Gmail address
  scopes                   text[] not null default '{}', -- granted scopes (must be read-only)
  access_token_ciphertext  text not null,        -- AES-256-GCM envelope, never plaintext
  refresh_token_ciphertext text,                 -- AES-256-GCM envelope, never plaintext
  access_token_expires_at  timestamptz,
  status                   connection_status_t not null default 'active',
  connected_at             timestamptz not null default now(),
  last_synced_at           timestamptz,
  revoked_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, provider, provider_account_id)
);

create index if not exists oauth_connections_user_idx
  on public.oauth_connections(user_id);

create trigger oauth_connections_set_updated_at
  before update on public.oauth_connections
  for each row execute function set_updated_at();

-- ── brands ──────────────────────────────────────────────────────────────────
-- The Enrolled Brands ledger (plans/ENROLLED_BRANDS_PRD.md). One row per promo
-- sender per user. source = 'enrolled' (we subscribed them) | 'detected'
-- (already in the inbox). Counts (deals_surfaced, total_saved) are derived from
-- offers/savings and may be cached here for cheap list rendering.
create table if not exists public.brands (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  brand                    text not null,
  brand_initials           text not null,
  logo_url                 text,
  category                 deal_category_t not null,
  source                   brand_source_t not null,
  status                   brand_status_t not null default 'active',
  enrolled_at              timestamptz not null default now(),
  enrolled_reason          text,
  sender_domain            text not null,   -- e.g. patagonia.com
  emails_per_month         integer not null default 0,
  can_one_click_unsubscribe boolean not null default false,
  unsubscribe_method       jsonb,           -- discovered RFC 8058 mechanism (mailto/http)
  last_offer_at            timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, sender_domain)
);

create index if not exists brands_user_idx on public.brands(user_id);

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function set_updated_at();

-- ── offers ──────────────────────────────────────────────────────────────────
-- Structured offers extracted from promo mail. Mirrors the frontend Deal type.
-- Linked to a brand. dedup_hash + source_message_id keep extraction idempotent.
-- No raw email body is ever stored here.
create table if not exists public.offers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  brand_id          uuid references public.brands(id) on delete set null,
  tier              deal_tier_t not null default 'personalized',
  category          deal_category_t not null,
  title             text not null,
  subtitle          text not null default '',
  savings_amount    numeric(12,2) not null default 0,
  savings_percent   numeric(5,2) not null default 0,
  original_price    numeric(12,2),
  deal_price        numeric(12,2),
  code              text,
  expires_at        timestamptz,
  terms             text not null default '',
  why_for_you       text,
  relevance_score   numeric(5,4),
  redeem_type       redeem_type_t not null default 'link',
  deal_url          text not null default '',
  source_message_id text,            -- opaque Gmail message id, for dedup only
  dedup_hash        text not null,   -- normalized hash of the offer for dedup
  detected_at       timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, dedup_hash)
);

create index if not exists offers_user_idx on public.offers(user_id);
create index if not exists offers_brand_idx on public.offers(brand_id);
create index if not exists offers_user_expires_idx on public.offers(user_id, expires_at);

create trigger offers_set_updated_at
  before update on public.offers
  for each row execute function set_updated_at();

-- ── savings ─────────────────────────────────────────────────────────────────
-- Realized-savings ledger: one row per redeemed/credited offer. Feeds the
-- Savings Summary and per-brand "$ saved" totals.
create table if not exists public.savings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  offer_id     uuid references public.offers(id) on delete set null,
  brand_id     uuid references public.brands(id) on delete set null,
  amount_saved numeric(12,2) not null default 0,
  redeemed_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists savings_user_idx on public.savings(user_id);
create index if not exists savings_brand_idx on public.savings(brand_id);

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- Enable on every user-owned table. The service-role key (used by the backend)
-- bypasses RLS; these policies protect against an anon key being misused.
alter table public.users             enable row level security;
alter table public.entitlements      enable row level security;
alter table public.oauth_connections enable row level security;
alter table public.brands            enable row level security;
alter table public.offers            enable row level security;
alter table public.savings           enable row level security;

-- users: a user can see/update only their own profile row.
create policy users_select_own on public.users
  for select using (id = auth.uid());
create policy users_update_own on public.users
  for update using (id = auth.uid());

-- Generic per-user read policies on the rest. Writes are intentionally NOT
-- granted to the anon role — only the backend (service role) mutates these,
-- so token storage, enrollment, and scans can't be forged from the client.
create policy entitlements_select_own on public.entitlements
  for select using (user_id = auth.uid());
create policy brands_select_own on public.brands
  for select using (user_id = auth.uid());
create policy offers_select_own on public.offers
  for select using (user_id = auth.uid());
create policy savings_select_own on public.savings
  for select using (user_id = auth.uid());

-- oauth_connections: NO anon access at all — not even select. Tokens (even
-- encrypted) and connection metadata are server-only.
-- (RLS enabled with zero policies = deny all for non-service-role.)

-- ── New-user provisioning ───────────────────────────────────────────────────
-- When Supabase Auth creates an auth.users row, mirror it into public.users and
-- give the user a default 'free' entitlement. SECURITY DEFINER so it runs with
-- the privileges needed regardless of the calling role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;

  insert into public.entitlements (user_id, tier)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
