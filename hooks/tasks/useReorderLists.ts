import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderLists } from "@/lib/tasks-api";
import type { List } from "@/types/tasks";

export function useReorderLists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => reorderLists(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const prev = queryClient.getQueryData<List[]>(["lists"]);
      const orderMap = new Map(items.map((i) => [i.id, i.sort_order]));
      queryClient.setQueryData<List[]>(["lists"], (old = []) =>
        old.map((l) => orderMap.has(l.id) ? { ...l, sort_order: orderMap.get(l.id)! } : l)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["lists"], ctx.prev);
    },
  });
}
