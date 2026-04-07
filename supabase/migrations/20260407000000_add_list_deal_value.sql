-- Add deal_value column to lists table
ALTER TABLE lists ADD COLUMN IF NOT EXISTS deal_value numeric(12, 2);
