-- ============================================================
-- Tasks Feature Schema
-- ============================================================
-- Run this migration when wiring up Supabase.
-- All in-memory mock data in lib/tasks-mock.ts follows this schema.
-- ============================================================

-- Lists
CREATE TABLE lists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  color           text,
  icon_url        text,
  is_archived     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  created_by      uuid REFERENCES auth.users
);

-- Tasks
CREATE TABLE tasks (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id                 uuid REFERENCES lists(id) ON DELETE CASCADE,
  title                   text NOT NULL,
  description             text,
  status                  text CHECK (status IN ('backlog', 'this_week', 'today', 'done')) DEFAULT 'backlog',
  priority                text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  assignee_id             uuid REFERENCES auth.users,
  time_estimate_minutes   integer,
  position                integer DEFAULT 1000,
  due_date                date,
  completed_at            timestamptz,
  created_at              timestamptz DEFAULT now()
);

-- Subtasks
CREATE TABLE subtasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title       text NOT NULL,
  is_complete boolean DEFAULT false,
  position    integer DEFAULT 1000,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- View: lists with computed stats
-- ============================================================
CREATE VIEW lists_with_stats AS
SELECT
  lists.*,
  COUNT(tasks.id) FILTER (
    WHERE tasks.status != 'done' AND tasks.completed_at IS NULL
  ) AS pending_task_count,
  SUM(tasks.time_estimate_minutes) FILTER (
    WHERE tasks.status != 'done'
  ) AS total_estimate_minutes
FROM lists
LEFT JOIN tasks ON tasks.list_id = lists.id
GROUP BY lists.id;

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE lists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Lists: created_by = current user
CREATE POLICY "Users see own lists" ON lists
  FOR ALL USING (created_by = auth.uid());

-- Tasks: belong to lists the user owns
CREATE POLICY "Users see own tasks" ON tasks
  FOR ALL USING (
    list_id IN (SELECT id FROM lists WHERE created_by = auth.uid())
  );

-- Subtasks: belong to tasks the user owns
CREATE POLICY "Users see own subtasks" ON subtasks
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN lists l ON l.id = t.list_id
      WHERE l.created_by = auth.uid()
    )
  );

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX tasks_list_id_idx    ON tasks(list_id);
CREATE INDEX tasks_status_idx     ON tasks(status);
CREATE INDEX subtasks_task_id_idx ON subtasks(task_id);
