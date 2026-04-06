ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS shoot_date          date,
  ADD COLUMN IF NOT EXISTS shoot_time          text,
  ADD COLUMN IF NOT EXISTS shoot_deliverables  text,
  ADD COLUMN IF NOT EXISTS shoot_invitee_ids   jsonb DEFAULT '[]';
