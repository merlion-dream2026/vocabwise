-- ============================================================
-- Phase 1: Referral System — DB Migration
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- 1. Thêm columns vào families
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS referral_code    VARCHAR(8) UNIQUE,
  ADD COLUMN IF NOT EXISTS bonus_pro_expires_at TIMESTAMPTZ;

-- 2. Backfill referral_code cho accounts cũ
UPDATE families
SET referral_code = UPPER(SUBSTRING(MD5(id::text || created_at::text), 1, 8))
WHERE referral_code IS NULL;

-- 3. Tạo bảng referrals
CREATE TABLE IF NOT EXISTS referrals (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id                 UUID REFERENCES families(id) ON DELETE CASCADE,
  referred_id                 UUID REFERENCES families(id) ON DELETE CASCADE,
  status                      VARCHAR(30) DEFAULT 'pending',
  -- pending | signup_triggered | signup_rewarded | paid_rewarded

  -- Signup reward (trigger: referred user hoàn thành vocab sync)
  signup_triggered_at         TIMESTAMPTZ,
  signup_reward_available_at  TIMESTAMPTZ,  -- triggered_at + 24h delay
  signup_rewarded_at          TIMESTAMPTZ,
  signup_reward_days          INTEGER DEFAULT 7,

  -- Paid reward (trigger: admin kích hoạt Pro cho referred user)
  paid_rewarded_at            TIMESTAMPTZ,
  paid_reward_days            INTEGER DEFAULT 14,

  created_at                  TIMESTAMPTZ DEFAULT now()
);

-- 1 referred user chỉ có 1 referral record
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred
  ON referrals(referred_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON referrals(referrer_id);

-- 4. Tạo bảng ip_flags (dùng ở Phase 5)
CREATE TABLE IF NOT EXISTS ip_flags (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip          VARCHAR(45),
  event_type  VARCHAR(50),   -- 'mass_register'
  count       INTEGER,
  flagged_at  TIMESTAMPTZ DEFAULT now(),
  reviewed    BOOLEAN DEFAULT false
);
