-- Per-child mascot companion (Rocky the elephant / Bubi the dolphin).
-- NULL = not chosen yet → the child is asked once on entering a learning screen; UI falls back to Rocky.
ALTER TABLE children ADD COLUMN IF NOT EXISTS mascot TEXT
  CHECK (mascot IS NULL OR mascot IN ('rocky', 'bubi'));
