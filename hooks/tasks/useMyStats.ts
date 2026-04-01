import { useQuery } from "@tanstack/react-query";
import { getMyStats } from "@/lib/tasks-api";
import { createClient } from "@/lib/supabase/client";

export function useMyStats() {
  return useQuery({
    queryKey: ["myStats"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { pending: 0, minutes: 0 };
      return getMyStats(user.id);
    },
  });
}
