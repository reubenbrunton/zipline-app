import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmailTemplate, TemplateVariable } from "@/types/emails";

async function fetchTemplates(): Promise<EmailTemplate[]> {
  const res = await fetch("/api/email-templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export function useEmailTemplates() {
  return useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: fetchTemplates,
  });
}

type CreateTemplateVars = {
  name: string;
  description?: string;
  resend_template_id: string;
  variables?: TemplateVariable[];
  preview_image_url?: string;
};

export function useCreateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: CreateTemplateVars) => {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to create template");
      }
      return res.json() as Promise<EmailTemplate>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}

type UpdateTemplateVars = { id: string } & Partial<CreateTemplateVars>;

export function useUpdateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateTemplateVars) => {
      const res = await fetch(`/api/email-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to update template");
      }
      return res.json() as Promise<EmailTemplate>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email-templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
}
