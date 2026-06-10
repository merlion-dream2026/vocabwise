-- ═══════════════════════════════════════════════════════════════
-- Migration: vw_user_topic_progress + vw_user_word_progress
-- Change: family_id → child_id (per-child progress tracking)
-- ═══════════════════════════════════════════════════════════════

-- vw_user_topic_progress
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vw_user_topic_progress' AND column_name = 'family_id'
  ) THEN
    ALTER TABLE vw_user_topic_progress RENAME COLUMN family_id TO child_id;
    DROP INDEX IF EXISTS idx_vw_utp_family;
    CREATE INDEX IF NOT EXISTS idx_vw_utp_child ON vw_user_topic_progress (child_id);
  END IF;
END $$;

-- vw_user_word_progress
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vw_user_word_progress' AND column_name = 'family_id'
  ) THEN
    ALTER TABLE vw_user_word_progress RENAME COLUMN family_id TO child_id;
    DROP INDEX IF EXISTS idx_vw_uwp_family;
    CREATE INDEX IF NOT EXISTS idx_vw_uwp_child ON vw_user_word_progress (child_id);
  END IF;
END $$;
