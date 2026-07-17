CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id    UUID REFERENCES children(id) ON DELETE CASCADE,  -- null = family-wide
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  url         TEXT,
  metadata    JSONB DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_family_created
  ON notifications(family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_family_unread
  ON notifications(family_id) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_notifications" ON notifications;
CREATE POLICY "deny_all_notifications" ON notifications FOR ALL USING (false);
