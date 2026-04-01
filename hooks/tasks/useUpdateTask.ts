import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "@/lib/tasks-api";
import type { Task } from "@/types/tasks";

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Task, "id" | "created_at">> }) =>
      updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      // Snapshot all task query caches
      const snapshots: Array<{ queryKey: unknown[]; prev: Task[] | undefined }> = [];
      queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }).forEach(([queryKey, data]) => {
        snapshots.push({ queryKey: queryKey as unknown[], prev: data });
        if (data) {
          queryClient.setQueryData<Task[]>(queryKey as string[], (old = []) =>
            old.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...patch,
                    assignee: Object.prototype.hasOwnProperty.call(patch, "assignee_id") ? undefined : t.assignee,
                    completed_at:
                      patch.status === "done"
                        ? t.completed_at ?? new Date().toISOString()
                        : patch.status
                        ? undefined
                        : t.completed_at,
                  }
                : t
            )
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
