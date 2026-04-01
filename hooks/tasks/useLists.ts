import { useQuery } from "@tanstack/react-query";
import { getLists } from "@/lib/tasks-api";

export function useLists() {
  return useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });
}
