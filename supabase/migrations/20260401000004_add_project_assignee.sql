-- ============================================================
-- Add assignee support for projects/lists
-- ============================================================

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES auth.users;

CREATE INDEX IF NOT EXISTS lists_assignee_id_idx ON lists(assignee_id);
