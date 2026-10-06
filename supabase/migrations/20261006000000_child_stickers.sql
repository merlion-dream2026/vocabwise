-- Topic stickers: one per (child, level, topic), awarded server-side the first time a topic is mastered.
-- Never deleted when mastery later regresses (the sticker is a keepsake and may already be redeemed).
--   legacy      – topic was already complete before stickers launched: shown in the album, not redeemable
--   redemption_id – set when a parent exchanges the sticker for a reward (added with the redemption feature)
CREATE TABLE IF NOT EXISTS child_stickers (
  id             BIGSERIAL PRIMARY KEY,
  child_id       UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  level          TEXT NOT NULL,
  topic_id       TEXT NOT NULL,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  legacy         BOOLEAN NOT NULL DEFAULT false,
  redemption_id  BIGINT,
  UNIQUE (child_id, level, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_child_stickers_child ON child_stickers (child_id);

ALTER TABLE child_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_child_stickers" ON child_stickers FOR ALL USING (false);
