-- Append-only SRS review log — one row per answer in an SRS session.
-- vocab_sync.srs only stores the *current* state (interval/due/ef), overwritten
-- on every review, so there was no way to verify "was this word actually
-- reviewed, and when" when investigating a user-reported bug. This log also
-- becomes the raw data needed if the scheduling algorithm is ever upgraded
-- (e.g. to FSRS, which fits its difficulty/stability model from review history).
CREATE TABLE IF NOT EXISTS vocab_srs_log (
  id               BIGSERIAL PRIMARY KEY,
  child_id         UUID REFERENCES children(id),
  level            TEXT NOT NULL,
  word             TEXT NOT NULL,
  is_correct       BOOLEAN NOT NULL,
  interval_before  INTEGER,
  interval_after   INTEGER NOT NULL,
  ef_before        NUMERIC,
  ef_after         NUMERIC NOT NULL,
  reviewed_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocab_srs_log_child_word ON vocab_srs_log (child_id, word);
CREATE INDEX IF NOT EXISTS idx_vocab_srs_log_reviewed_at ON vocab_srs_log (reviewed_at DESC);

ALTER TABLE vocab_srs_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_vocab_srs_log" ON vocab_srs_log FOR ALL USING (false);
