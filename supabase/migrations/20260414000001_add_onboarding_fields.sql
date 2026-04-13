-- Add onboarding form fields to crm_contacts
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS job_position text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS has_branding_assets text,
  ADD COLUMN IF NOT EXISTS branding_assets_url text,
  ADD COLUMN IF NOT EXISTS service_agreement_signed boolean NOT NULL DEFAULT false;
