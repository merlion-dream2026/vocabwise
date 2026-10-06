-- Academic progress per child. vw_academic_sync (keyed by family) is kept untouched for reference/rollback;
-- new reads and writes go here. Existing family-level progress is intentionally NOT copied — each child starts fresh.
CREATE TABLE IF NOT EXISTS vw_academic_sync_child (
  child_id        UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  mastery         JSONB NOT NULL DEFAULT '{}'::jsonb,
  srs             JSONB NOT NULL DEFAULT '{}'::jsonb,
  history         JSONB NOT NULL DEFAULT '{}'::jsonb,
  revision_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vw_academic_sync_child ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_vw_academic_sync_child" ON vw_academic_sync_child FOR ALL USING (false);
