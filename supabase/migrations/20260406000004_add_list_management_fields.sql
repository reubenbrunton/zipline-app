ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS management_started_at timestamptz;
