-- VocabKids Pro — Row Level Security
-- Run this in Supabase Dashboard → SQL Editor
-- All server routes use service_role key (bypasses RLS).
-- RLS here blocks direct anon-key queries from the browser (defense-in-depth).

-- families: deny all anon access
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_families" ON families;
CREATE POLICY "deny_all_families" ON families FOR ALL USING (false);

-- children: deny all anon access
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_children" ON children;
CREATE POLICY "deny_all_children" ON children FOR ALL USING (false);

-- vocab_sync: deny all anon access
ALTER TABLE vocab_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_vocab_sync" ON vocab_sync;
CREATE POLICY "deny_all_vocab_sync" ON vocab_sync FOR ALL USING (false);

-- admin_config: read-only for anon (non-sensitive global config)
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_admin_config" ON admin_config;
CREATE POLICY "deny_all_admin_config" ON admin_config FOR ALL USING (false);
