-- One row per Azure-scored recording (/api/score-pronunciation): the scores behind each pass/fail,
-- to recalibrate the kid-friendly bars in lib/pronunciationScore.ts on real children's voices.
-- family_id is text (no FK): the superadmin session uses the literal 'superadmin'.
CREATE TABLE IF NOT EXISTS pronunciation_log (
  id           BIGSERIAL PRIMARY KEY,
  family_id    TEXT,
  source       TEXT NOT NULL,          -- speak | phonics | quick
  level        TEXT,
  target       TEXT,
  ok           BOOLEAN NOT NULL,
  pron_score   SMALLINT,
  accuracy     SMALLINT,
  fluency      SMALLINT,
  completeness SMALLINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pronunciation_log_created_idx ON pronunciation_log (created_at DESC);
ALTER TABLE pronunciation_log ENABLE ROW LEVEL SECURITY; -- service role only
