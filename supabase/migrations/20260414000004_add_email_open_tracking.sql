-- Add open tracking fields to email_sends
ALTER TABLE email_sends
  ADD COLUMN IF NOT EXISTS resend_email_id text,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS email_sends_resend_id_idx ON email_sends (resend_email_id);
