import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubtask, updateSubtask, deleteSubtask } from "@/lib/tasks-mock";
import type { Task } from "@/types/tasks";

export function useCreateSubtask(taskId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubtask,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}

export function useUpdateSubtask(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title?: string; is_complete?: boolean } }) =>
      updateSubtask(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshots: Array<{ queryKey: unknown[]; prev: Task[] | undefined }> = [];
      queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }).forEach(([queryKey, data]) => {
        snapshots.push({ queryKey: queryKey as unknown[], prev: data });
        if (data) {
          queryClient.setQueryData<Task[]>(queryKey as string[], (old = []) =>
            old.map((task) => ({
              ...task,
              subtasks: task.subtasks?.map((s) =>
                s.id === id ? { ...s, ...patch } : s
              ),
            }))
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
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}

export function useDeleteSubtask(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubtask,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}
