-- Bumped on password change/reset to revoke every outstanding JWT of the family (lib/sessionGuard.ts).
ALTER TABLE families ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
