import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTask } from "@/lib/tasks-mock";
import type { Task } from "@/types/tasks";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshots: Array<{ queryKey: unknown[]; prev: Task[] | undefined }> = [];
      queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }).forEach(([queryKey, data]) => {
        snapshots.push({ queryKey: queryKey as unknown[], prev: data });
        if (data) {
          queryClient.setQueryData<Task[]>(queryKey as string[], (old = []) =>
            old.filter((t) => t.id !== id)
          );
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(({ queryKey, prev }) => {
        if (prev) queryClient.setQueryData(queryKey, prev);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
