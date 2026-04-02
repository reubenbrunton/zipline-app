-- ============================================================
-- Calendar sharing between app users
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  calendar_id text NOT NULL,
  calendar_name text,
  calendar_color text DEFAULT '#6366F1',
  created_at  timestamptz DEFAULT now(),
  UNIQUE (owner_id, shared_with, calendar_id)
);

ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;

-- Owners can manage their shares
DROP POLICY IF EXISTS "Owners manage their calendar shares" ON calendar_shares;
CREATE POLICY "Owners manage their calendar shares" ON calendar_shares
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Recipients can see shares directed at them
DROP POLICY IF EXISTS "Recipients can view their shares" ON calendar_shares;
CREATE POLICY "Recipients can view their shares" ON calendar_shares
  FOR SELECT USING (auth.uid() = shared_with);
