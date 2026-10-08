-- When the child finished (or skipped) the mascot hello slides. NULL → show them once on the next
-- learning screen. Reset to NULL when the mascot changes, so the child meets the new companion too.
ALTER TABLE children ADD COLUMN IF NOT EXISTS mascot_intro_seen_at TIMESTAMPTZ;
