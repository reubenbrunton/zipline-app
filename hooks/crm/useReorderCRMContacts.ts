import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderCRMContacts } from "@/lib/crm-api";
import type { CRMContact } from "@/types/crm";

export function useReorderCRMContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => reorderCRMContacts(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["crm_contacts"] });
      const prev = queryClient.getQueryData<CRMContact[]>(["crm_contacts"]);
      const orderMap = new Map(items.map((i) => [i.id, i.sort_order]));
      queryClient.setQueryData<CRMContact[]>(["crm_contacts"], (old = []) =>
        old.map((c) => orderMap.has(c.id) ? { ...c, sort_order: orderMap.get(c.id)! } : c)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["crm_contacts"], ctx.prev);
    },
  });
}
