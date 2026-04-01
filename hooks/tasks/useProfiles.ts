import { useQuery } from "@tanstack/react-query";
import { getProfiles } from "@/lib/tasks-api";

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: getProfiles,
    staleTime: 5 * 60 * 1000,
  });
}
