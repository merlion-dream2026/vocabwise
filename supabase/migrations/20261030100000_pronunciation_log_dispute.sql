-- Threshold calibration (docs/pronunciation-thresholds-plan.md):
--   grp         bar group used for the verdict (young | mid | ielts) → per-group pass/dispute rates
--   detail      key-word scores incl. phonemes, to see which sounds fail (no audio is stored)
--   disputed_at learner tapped "Con đọc đúng mà" under a failed result (false-reject signal)
ALTER TABLE pronunciation_log ADD COLUMN IF NOT EXISTS grp TEXT;
ALTER TABLE pronunciation_log ADD COLUMN IF NOT EXISTS detail JSONB;
ALTER TABLE pronunciation_log ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS pronunciation_log_grp_idx ON pronunciation_log (grp, created_at DESC);
