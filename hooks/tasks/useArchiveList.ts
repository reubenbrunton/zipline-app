import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveList } from "@/lib/tasks-api";

export function useArchiveList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveList,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
