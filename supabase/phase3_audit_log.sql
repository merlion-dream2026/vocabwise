-- ============================================================
-- Phase 3: Admin Audit Log — DB Migration
-- Chạy trong Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action           TEXT NOT NULL,       -- 'create_family' | 'update_family' | 'delete_family'
  target_id        TEXT,
  target_username  TEXT,
  details          JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log(created_at DESC);
