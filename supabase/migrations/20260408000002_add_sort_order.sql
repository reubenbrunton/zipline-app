-- Add sort_order to lists
ALTER TABLE lists ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Initialise sort_order from created_at within each stage
UPDATE lists SET sort_order = subq.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY stage ORDER BY created_at) - 1)::integer AS rn FROM lists
) AS subq
WHERE lists.id = subq.id;

-- Add sort_order to crm_contacts
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Initialise sort_order from created_at within each stage
UPDATE crm_contacts SET sort_order = subq.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY pipeline_stage ORDER BY created_at) - 1)::integer AS rn FROM crm_contacts
) AS subq
WHERE crm_contacts.id = subq.id;
