import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createList } from "@/lib/tasks-mock";
import type { List, ListStage } from "@/types/tasks";

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createList,
    onMutate: async (newList) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const prev = queryClient.getQueryData<List[]>(["lists"]);
      queryClient.setQueryData<List[]>(["lists"], (old = []) => [
        ...old,
        {
          id: "temp-" + Date.now(),
          name: newList.name,
          color: newList.color,
          client_contact_id: newList.client_contact_id,
          client_name: newList.client_name,
          icon_url: newList.icon_url,
          stage: (newList.stage ?? "pre_production") as ListStage,
          is_archived: false,
          created_at: new Date().toISOString(),
          total_task_count: 0,
          pending_task_count: 0,
          total_estimate_minutes: 0,
          has_high_priority: false,
          members: [],
          member_count: 0,
        },
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["lists"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
