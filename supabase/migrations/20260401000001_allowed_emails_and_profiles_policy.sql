-- ============================================================
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. allowed_emails — whitelist for platform access
CREATE TABLE IF NOT EXISTS allowed_emails (
  email      text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Service role bypasses RLS, deny all other access
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON allowed_emails USING (false);

-- 2. Back-fill allowed_emails from existing auth users
INSERT INTO allowed_emails (email)
SELECT lower(email) FROM auth.users
ON CONFLICT (email) DO NOTHING;

-- 3. Let any authenticated user see all profiles (needed for team page)
--    First drop the old select-only policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Keep update/insert policies scoped to own profile
