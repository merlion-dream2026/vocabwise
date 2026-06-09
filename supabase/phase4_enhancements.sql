-- ============================================================
-- Phase 4: Admin Note + Last Active — DB Migration
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- 1. Admin note per account
ALTER TABLE families ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- 2. RPC: last active date per family (via vocab_sync)
CREATE OR REPLACE FUNCTION get_family_last_active()
RETURNS TABLE(family_id UUID, last_active TIMESTAMPTZ)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT c.family_id, MAX(vs.updated_at) AS last_active
  FROM children c
  INNER JOIN vocab_sync vs ON vs.child_id = c.id
  GROUP BY c.family_id
$$;
