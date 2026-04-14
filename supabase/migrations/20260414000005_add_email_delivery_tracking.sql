ALTER TABLE email_sends
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'sent';
-- delivery_status values: 'sent' | 'delivered' | 'clicked' | 'bounced'
