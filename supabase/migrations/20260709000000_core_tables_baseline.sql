-- ═══════════════════════════════════════════════════════════════
-- Baseline: core tables that predate the migration history
-- (families, children, vocab_sync, admin_config, super_admin)
--
-- These tables already exist in production — they were created out-of-band
-- via the Supabase SQL editor before migrations/ was adopted, so `supabase
-- db reset` / a fresh project could not reproduce them. This file captures
-- the CURRENT production schema (dumped 2026-07-09 via Supabase MCP
-- list_tables) as CREATE TABLE IF NOT EXISTS, so it's a safe no-op against
-- the existing database and a working baseline for a fresh one.
--
-- Not exhaustive: does not re-declare RLS policies (see supabase/rls.sql)
-- or the other out-of-band files (phase1_referral.sql, phase3_audit_log.sql,
-- phase4_enhancements.sql) — those still need to be folded into migrations/
-- separately.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS families (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username                  TEXT NOT NULL UNIQUE,
  password_hash             TEXT NOT NULL,
  name                      TEXT,
  phone                     TEXT,
  email                     TEXT,
  email_verified            BOOLEAN DEFAULT false,
  otp                       TEXT,
  otp_expires_at            TIMESTAMPTZ,
  plan                      TEXT DEFAULT 'free',
  plan_start_date           DATE,
  plan_end_date             DATE,
  plan_expires_at           TIMESTAMPTZ,
  free_trial_expires_at     TIMESTAMPTZ,
  bonus_pro_expires_at      TIMESTAMPTZ,
  bonus_features            TEXT[],
  max_kids                  INTEGER,
  disabled                  BOOLEAN DEFAULT false,
  is_blocked                BOOLEAN DEFAULT false,
  failed_login_count        INTEGER DEFAULT 0,
  lockout_until             TIMESTAMPTZ,
  reset_token               TEXT,
  reset_token_expires_at    TIMESTAMPTZ,
  gift_token                VARCHAR UNIQUE,
  referral_code             VARCHAR UNIQUE,
  referral_source           TEXT,
  report_settings           JSONB DEFAULT '{"day": 1, "hour": 8, "enabled": false, "schedule": "manual"}'::jsonb,
  registration_ip           TEXT,
  last_request_ip           TEXT,
  last_request_at           TIMESTAMPTZ,
  last_request_country      CHAR,
  admin_note                TEXT,
  created_at                TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS children (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID REFERENCES families(id),
  name          TEXT NOT NULL,
  level         TEXT NOT NULL,
  emoji         TEXT DEFAULT '🧒',
  theme         TEXT DEFAULT 'pink',
  pin           TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vocab_sync (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID REFERENCES children(id),
  level             TEXT NOT NULL,
  seen              TEXT[] DEFAULT '{}',
  weak_words        JSONB DEFAULT '{}'::jsonb,
  streak            JSONB DEFAULT '{}'::jsonb,
  battle            JSONB DEFAULT '{}'::jsonb,
  mastery           JSONB DEFAULT '{}'::jsonb,
  history           JSONB DEFAULT '{}'::jsonb,
  srs               JSONB DEFAULT '{}'::jsonb,
  revision_scores   JSONB DEFAULT '{}'::jsonb,
  reset_at          TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_config (
  key     TEXT PRIMARY KEY,
  value   TEXT NOT NULL
);

-- Separate admin identity used by the actual /superadmin login flow
-- (app/api/superadmin/login) — distinct from families.id = 'superadmin'.
CREATE TABLE IF NOT EXISTS super_admin (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  password_hash  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_children_family_id ON children (family_id);
CREATE INDEX IF NOT EXISTS idx_vocab_sync_child_id ON vocab_sync (child_id);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin ENABLE ROW LEVEL SECURITY;
