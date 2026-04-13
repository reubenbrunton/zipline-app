ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS service_agreement_signed_at timestamptz;
