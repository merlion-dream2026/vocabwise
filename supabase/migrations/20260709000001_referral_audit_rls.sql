-- ═══════════════════════════════════════════════════════════════
-- Consolidates 4 out-of-band SQL files that were run by hand via the
-- Supabase SQL editor and never added to migrations/:
--   phase1_referral.sql, phase3_audit_log.sql, phase4_enhancements.sql, rls.sql
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP+CREATE
-- POLICY) so this is a safe no-op against the current database.
-- (supabase/vocabwise_schema.sql was NOT folded in — it's byte-identical to
-- migrations/20260609000000_vocabwise_schema.sql, a pure leftover duplicate.)
-- ═══════════════════════════════════════════════════════════════

-- ── Phase 1: Referral system ──────────────────────────────────────────────

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS referral_code    VARCHAR(8) UNIQUE,
  ADD COLUMN IF NOT EXISTS bonus_pro_expires_at TIMESTAMPTZ;

UPDATE families
SET referral_code = UPPER(SUBSTRING(MD5(id::text || created_at::text), 1, 8))
WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id                 UUID REFERENCES families(id) ON DELETE CASCADE,
  referred_id                 UUID REFERENCES families(id) ON DELETE CASCADE,
  status                      VARCHAR(30) DEFAULT 'pending',
  -- pending | signup_triggered | signup_rewarded | paid_rewarded

  signup_triggered_at         TIMESTAMPTZ,
  signup_reward_available_at  TIMESTAMPTZ,  -- triggered_at + 24h delay
  signup_rewarded_at          TIMESTAMPTZ,
  signup_reward_days          INTEGER DEFAULT 7,

  paid_rewarded_at            TIMESTAMPTZ,
  paid_reward_days            INTEGER DEFAULT 14,

  created_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

CREATE TABLE IF NOT EXISTS ip_flags (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip          VARCHAR(45),
  event_type  VARCHAR(50),   -- 'mass_register'
  count       INTEGER,
  flagged_at  TIMESTAMPTZ DEFAULT now(),
  reviewed    BOOLEAN DEFAULT false
);

-- ── Phase 3: Admin audit log ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action           TEXT NOT NULL,       -- 'create_family' | 'update_family' | 'delete_family'
  target_id        TEXT,
  target_username  TEXT,
  details          JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);

-- ── Phase 4: Admin note + last-active RPC ─────────────────────────────────

ALTER TABLE families ADD COLUMN IF NOT EXISTS admin_note TEXT;

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

-- ── RLS: deny-all for anon key on core tables ─────────────────────────────
-- All server routes use the service_role key (bypasses RLS). This blocks
-- direct anon-key queries from the browser (defense-in-depth).

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_families" ON families;
CREATE POLICY "deny_all_families" ON families FOR ALL USING (false);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_children" ON children;
CREATE POLICY "deny_all_children" ON children FOR ALL USING (false);

ALTER TABLE vocab_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_vocab_sync" ON vocab_sync;
CREATE POLICY "deny_all_vocab_sync" ON vocab_sync FOR ALL USING (false);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_admin_config" ON admin_config;
CREATE POLICY "deny_all_admin_config" ON admin_config FOR ALL USING (false);
