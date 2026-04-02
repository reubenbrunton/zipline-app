-- ============================================================
-- Store Google OAuth tokens per user
-- ============================================================

CREATE TABLE IF NOT EXISTS google_tokens (
  user_id       uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  access_token  text NOT NULL,
  refresh_token text,
  expires_at    timestamptz NOT NULL,
  scope         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own tokens
DROP POLICY IF EXISTS "Users manage own google tokens" ON google_tokens;
CREATE POLICY "Users manage own google tokens" ON google_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role can manage all tokens (for refresh)
DROP POLICY IF EXISTS "Service role manages google tokens" ON google_tokens;
CREATE POLICY "Service role manages google tokens" ON google_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Per-user selected calendar IDs (which calendars to show)
CREATE TABLE IF NOT EXISTS google_calendar_prefs (
  user_id      uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  calendar_ids text[] NOT NULL DEFAULT '{}',
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE google_calendar_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own calendar prefs" ON google_calendar_prefs;
CREATE POLICY "Users manage own calendar prefs" ON google_calendar_prefs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
