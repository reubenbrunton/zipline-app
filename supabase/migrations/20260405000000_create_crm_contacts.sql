-- ============================================================
-- CRM Contacts Schema
-- ============================================================

CREATE TABLE crm_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company         text NOT NULL,
  logo_initials   text,
  logo_color      text DEFAULT '#6366F1',
  contact         text,
  phone           text,
  email           text,
  website         text,
  pipeline_stage  text NOT NULL DEFAULT 'New Lead',
  service         text,
  tags            jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  created_by      uuid REFERENCES auth.users
);

-- ============================================================
-- Row Level Security — all authenticated users share CRM data
-- ============================================================
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage CRM contacts" ON crm_contacts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX crm_contacts_pipeline_stage_idx ON crm_contacts(pipeline_stage);
CREATE INDEX crm_contacts_created_at_idx     ON crm_contacts(created_at);
