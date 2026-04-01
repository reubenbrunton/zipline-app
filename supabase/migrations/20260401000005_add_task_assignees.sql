-- ============================================================
-- Add multi-assignee support for tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS task_assignees_user_id_idx ON task_assignees(user_id);

ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members see all task assignees" ON task_assignees;
DROP POLICY IF EXISTS "Users see own task assignees" ON task_assignees;
CREATE POLICY "Team members see all task assignees" ON task_assignees
  FOR ALL USING (auth.uid() IS NOT NULL);

INSERT INTO task_assignees (task_id, user_id)
SELECT id, assignee_id
FROM tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;
