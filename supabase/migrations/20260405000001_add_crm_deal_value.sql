-- Add deal_value to crm_contacts
-- Run in Supabase SQL Editor

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS deal_value numeric(12, 2);
