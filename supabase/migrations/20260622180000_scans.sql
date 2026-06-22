-- DealFinder — scan job state (Phase 2 / Phase A)
-- Tracks each inbox scan run so the frontend First Scan screen can poll real
-- progress, and so we never run two scans for the same connection at once.
--
-- IDEMPOTENT — safe to re-run (same style as 20260622170000_init.sql).
--
-- Design notes:
--  * One row per scan run. The in-process worker flips status queued→running→
--    done|error and increments the counters as it works.
--  * No raw email is stored here either (data minimization, PRD §8) — only the
--    aggregate counts the magic-moment reveal needs (messages scanned, offers
--    found, total $ surfaced).
--  * RLS: a user can read their own scans; writes are service-role only (the
--    worker), exactly like brands/offers/savings.

-- ── Enum ────────────────────────────────────────────────────────────────────
do $$ begin
  create type scan_status_t as enum ('queued', 'running', 'done', 'error');
exception when duplicate_object then null; end $$;

-- ── scans ───────────────────────────────────────────────────────────────────
create table if not exists public.scans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  connection_id    uuid references public.oauth_connections(id) on delete set null,
  status           scan_status_t not null default 'queued',
  messages_scanned integer not null default 0,
  offers_found     integer not null default 0,
  found_total      numeric(12,2) not null default 0,  -- $ surfaced this scan
  error            text,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists scans_user_idx on public.scans(user_id);
create index if not exists scans_user_created_idx
  on public.scans(user_id, created_at desc);

drop trigger if exists scans_set_updated_at on public.scans;
create trigger scans_set_updated_at
  before update on public.scans
  for each row execute function set_updated_at();

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.scans enable row level security;

-- A user can read their own scan rows; only the backend (service role) writes.
drop policy if exists scans_select_own on public.scans;
create policy scans_select_own on public.scans
  for select using (user_id = auth.uid());
