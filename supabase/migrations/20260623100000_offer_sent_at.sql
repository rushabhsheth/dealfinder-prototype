-- Track when the source email was sent, so the feed can show "Sent 3 days ago"
-- on each deal card. This is the email's own date (msg.date), distinct from
-- detected_at (when our scan found it). Nullable — older offers won't have it.
--
-- Idempotent — safe to re-run.

alter table public.offers
  add column if not exists source_sent_at timestamptz;
