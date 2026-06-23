-- Chunked scan: drive the scan incrementally from the polling requests instead
-- of one fire-and-forget background job (which Vercel freezes after the response).
--
-- POST /scans lists the promo message ids once and stores them here; each
-- GET /scans/:id poll processes the next BATCH within its own short function
-- invocation, advancing `cursor` until it reaches the end → status 'done'.
--
-- Idempotent — safe to re-run.

alter table public.scans
  add column if not exists message_ids jsonb not null default '[]'::jsonb,
  add column if not exists cursor integer not null default 0,
  add column if not exists prefs jsonb;
