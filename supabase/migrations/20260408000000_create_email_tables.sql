-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  resend_template_id text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  preview_image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Email sends audit log
CREATE TABLE IF NOT EXISTS email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  template_name text,
  to_email text NOT NULL,
  to_name text,
  contact_id text,
  variables jsonb DEFAULT '{}'::jsonb,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read email sends"
  ON email_sends FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert email sends"
  ON email_sends FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
