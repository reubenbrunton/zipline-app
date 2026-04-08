import { useMutation, useQueryClient } from "@tanstack/react-query";

type SendEmailVars = {
  resendTemplateId: string;
  templateId?: string;
  templateName?: string;
  toEmail: string;
  toName?: string;
  contactId?: string;
  variables?: Record<string, string>;
};

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: SendEmailVars) => {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to send email");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-sends"] }),
  });
}
