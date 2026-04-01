import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/lib/tasks-api";
import type { Task } from "@/types/tasks";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      const queryKey = ["tasks", newTask.list_id];
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Task[]>(queryKey);
      const optimistic: Task = {
        id: "temp-" + Date.now(),
        list_id: newTask.list_id,
        title: newTask.title,
        status: newTask.status,
        priority: "medium",
        time_estimate_minutes: newTask.time_estimate_minutes,
        position: 9999,
        created_at: new Date().toISOString(),
        subtasks: [],
      };
      queryClient.setQueryData<Task[]>(queryKey, (old = []) => [...old, optimistic]);
      // Also update "all" cache
      queryClient.setQueryData<Task[]>(["tasks", "all"], (old = []) => [...old, optimistic]);
      return { prev, queryKey };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
