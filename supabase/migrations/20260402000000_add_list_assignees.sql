-- ============================================================
-- Add multi-assignee support for lists/projects
-- ============================================================

CREATE TABLE IF NOT EXISTS list_assignees (
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS list_assignees_user_id_idx ON list_assignees(user_id);

ALTER TABLE list_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members see all list assignees" ON list_assignees;
CREATE POLICY "Team members see all list assignees" ON list_assignees
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Seed existing single assignees into the junction table
INSERT INTO list_assignees (list_id, user_id)
SELECT id, assignee_id
FROM lists
WHERE assignee_id IS NOT NULL
ON CONFLICT (list_id, user_id) DO NOTHING;
