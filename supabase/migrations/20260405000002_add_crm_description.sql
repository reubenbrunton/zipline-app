-- Add description to crm_contacts
-- Run in Supabase SQL Editor

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS description text;
