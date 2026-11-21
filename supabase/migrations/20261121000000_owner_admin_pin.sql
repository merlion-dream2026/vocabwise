-- Owner shortcut into /superadmin: the owner family (is_owner) enters a 6-digit admin PIN from
-- Dashboard → Cài đặt; forgotten/first-time PIN goes through a one-time code emailed to ADMIN_ALERT_EMAIL.
-- Counters live in the DB (not Redis) so lockout/OTP survive across Vercel instances without Upstash.
alter table families
  add column if not exists is_owner boolean not null default false,
  add column if not exists admin_pin_hash text,
  add column if not exists admin_pin_failed integer not null default 0,
  add column if not exists admin_pin_locked_until timestamptz,
  add column if not exists admin_otp_hash text,
  add column if not exists admin_otp_expires_at timestamptz,
  add column if not exists admin_otp_attempts integer not null default 0;
