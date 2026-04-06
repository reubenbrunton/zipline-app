ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS blocked_pages text[] DEFAULT '{}';
