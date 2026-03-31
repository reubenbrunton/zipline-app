import { useQuery } from "@tanstack/react-query";
import { getMyStats } from "@/lib/tasks-mock";

export function useMyStats(userId: string) {
  return useQuery({
    queryKey: ["myStats", userId],
    queryFn: () => getMyStats(userId),
  });
}
