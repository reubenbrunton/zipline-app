import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveList } from "@/lib/tasks-mock";

export function useArchiveList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveList,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
