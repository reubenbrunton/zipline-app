-- Track when a contact moves into the Onboarded stage
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- Auto-set onboarded_at whenever pipeline_stage changes TO 'Onboarded'
CREATE OR REPLACE FUNCTION set_onboarded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pipeline_stage = 'Onboarded' AND (OLD.pipeline_stage IS DISTINCT FROM 'Onboarded') THEN
    NEW.onboarded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_onboarded_at ON crm_contacts;
CREATE TRIGGER trg_set_onboarded_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION set_onboarded_at();
