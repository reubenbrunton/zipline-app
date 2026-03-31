import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateList } from "@/lib/tasks-mock";
import type { List } from "@/types/tasks";

type UpdateListVars = {
  id: string;
  patch: Partial<Pick<List, "name" | "color" | "stage" | "client_contact_id" | "client_name">>;
};

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: UpdateListVars) => updateList(id, patch),

    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const prev = queryClient.getQueryData<List[]>(["lists"]);

      queryClient.setQueryData<List[]>(["lists"], (old = []) =>
        old.map((l) => (l.id === id ? { ...l, ...patch } : l))
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
