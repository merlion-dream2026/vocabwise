-- Per-family push reminder schedule: { "<0-6, VN getDay>": "HH:MM" } on a 15-min grid.
-- NULL = default (every day 08:00). Kept on families (not push_subscriptions) so it
-- survives turning notifications off/on or a subscription expiring.
ALTER TABLE families ADD COLUMN IF NOT EXISTS push_schedule JSONB;
-- Dedup guard for /api/cron/push-scheduled (skip families sent within the last 10 min)
ALTER TABLE families ADD COLUMN IF NOT EXISTS push_last_sent_at TIMESTAMPTZ;

-- Trigger: every 15 min, Postgres calls the Vercel route (Vercel Hobby crons are daily-only).
-- The bearer token is read from Supabase Vault at run time — create it once in the SQL editor:
--   select vault.create_secret('<CRON_SECRET value>', 'vocabwise_cron_secret');
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'vocabwise-push-scheduled',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vocabwise.id.vn/api/cron/push-scheduled',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'vocabwise_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
