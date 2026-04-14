export type VariableType = "text" | "textarea" | "url" | "date";

export interface TemplateVariable {
  key: string;
  label: string;
  type: VariableType;
  required: boolean;
  placeholder?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  resend_template_id: string;
  variables: TemplateVariable[];
  preview_image_url?: string;
  created_at: string;
}

export interface EmailSend {
  id: string;
  template_id?: string;
  template_name?: string;
  to_email: string;
  to_name?: string;
  contact_id?: string;
  variables: Record<string, string>;
  sent_by?: string;
  sent_at: string;
  resend_email_id?: string;
  opened_at?: string;
  open_count: number;
}
