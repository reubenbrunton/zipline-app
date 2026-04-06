import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateList } from "@/lib/tasks-api";
import type { List } from "@/types/tasks";

type UpdateListVars = {
  id: string;
  patch: Partial<Pick<List, "name" | "color" | "stage" | "assignee_id" | "assignee_ids" | "client_contact_id" | "client_name" | "shoot_date" | "shoot_time" | "shoot_deliverables" | "shoot_invitee_ids" | "revision_version" | "management_started_at">>;
};

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: UpdateListVars) => updateList(id, patch),

    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const prev = queryClient.getQueryData<List[]>(["lists"]);

      queryClient.setQueryData<List[]>(["lists"], (old = []) =>
        old.map((l) =>
          l.id === id
            ? {
                ...l,
                ...patch,
                assignee: Object.prototype.hasOwnProperty.call(patch, "assignee_id") || Object.prototype.hasOwnProperty.call(patch, "assignee_ids") ? undefined : l.assignee,
                assignees: Object.prototype.hasOwnProperty.call(patch, "assignee_ids") ? [] : l.assignees,
              }
            : l
        )
      );

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
