-- Sticker rewards, phase 2: parent PIN, redemption history, per-collection stickers.
--
-- families: a 4-digit parent PIN (bcrypt) guarding the Quà tặng area, with a failed-attempt lockout.
-- child_stickers.collection: 'daily' | 'academic' | 'phonics' — lets one sticker table serve every module.
--   The old UNIQUE (child_id, level, topic_id) is kept (harmless: level keys never collide across
--   collections) so code deployed before this migration keeps working; the new key adds `collection`.
-- sticker_redemptions: append-only history. A redemption is just "parent marked N stickers as exchanged,
--   optional free-text note" — the reward itself (money, gift …) is agreed verbally, never stored as a value.
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS parent_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS parent_pin_failed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_pin_locked_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sticker_redemptions (
  id            BIGSERIAL PRIMARY KEY,
  child_id      UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id     UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  sticker_count INTEGER NOT NULL CHECK (sticker_count > 0),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sticker_redemptions_child ON sticker_redemptions (child_id, created_at DESC);
ALTER TABLE sticker_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_sticker_redemptions" ON sticker_redemptions FOR ALL USING (false);

ALTER TABLE child_stickers ADD COLUMN IF NOT EXISTS collection TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE child_stickers ADD CONSTRAINT child_stickers_unique_collection UNIQUE (child_id, collection, level, topic_id);
ALTER TABLE child_stickers ADD CONSTRAINT child_stickers_redemption_fk FOREIGN KEY (redemption_id) REFERENCES sticker_redemptions(id);
