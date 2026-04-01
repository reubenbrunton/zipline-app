-- ============================================================
-- Run this in the Supabase SQL editor if not already applied.
-- ============================================================

-- 1. Add missing columns to lists table
ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS stage        text DEFAULT 'pre_production',
  ADD COLUMN IF NOT EXISTS client_name  text,
  ADD COLUMN IF NOT EXISTS client_contact_id integer;

-- 2. Profiles table (stores per-user display info)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   text,
  email       text,
  avatar_url  text,
  phone       text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 3. Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Back-fill profiles for any users who signed up before this migration
INSERT INTO profiles (id, full_name, email, avatar_url)
SELECT
  id,
  raw_user_meta_data->>'full_name',
  email,
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
