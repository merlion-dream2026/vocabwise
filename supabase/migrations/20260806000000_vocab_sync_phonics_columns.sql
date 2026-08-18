-- lib/phonicsSync.ts's flushPhonics() has always sent sound_acc/last_reviewed/badges
-- to POST /api/sync/[childId], but the route never destructured them and vocab_sync
-- never had columns for them — silently dropped every time. "Ôn âm yếu" (weak sounds),
-- lesson-decay "Ôn lại" suggestions, and phonics badges all reset to empty on every
-- page load as a result. Wiring these into the schema + route now (separate change).
ALTER TABLE vocab_sync
  ADD COLUMN IF NOT EXISTS sound_acc     JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_reviewed JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS badges        TEXT[] DEFAULT '{}';
