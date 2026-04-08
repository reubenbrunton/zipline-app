import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EmailSend } from "@/types/emails";

export function useEmailSends(limit = 20) {
  return useQuery<EmailSend[]>({
    queryKey: ["email-sends"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("email_sends")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as EmailSend[];
    },
  });
}
