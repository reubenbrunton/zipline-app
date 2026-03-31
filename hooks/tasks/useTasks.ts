import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/tasks-mock";

export function useTasks(listId?: string) {
  return useQuery({
    queryKey: ["tasks", listId ?? "all"],
    queryFn: () => getTasks(listId),
  });
}
