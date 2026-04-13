import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EmailSend } from "@/types/emails";

export function useEmailSends() {
  return useQuery<EmailSend[]>({
    queryKey: ["email-sends"],
    queryFn: async () => {
      const supabase = createClient();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data, error } = await supabase
        .from("email_sends")
        .select("*")
        .gte("sent_at", cutoff.toISOString())
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data as EmailSend[];
    },
  });
}
