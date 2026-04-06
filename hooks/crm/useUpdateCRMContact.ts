import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCRMContact } from '@/lib/crm-api'
import type { CRMContact } from '@/types/crm'

export function useUpdateCRMContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<CRMContact, 'id' | 'created_at'>> }) =>
      updateCRMContact(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['crm_contacts'] })
      const prev = queryClient.getQueryData<CRMContact[]>(['crm_contacts'])

      queryClient.setQueryData<CRMContact[]>(['crm_contacts'], (old = []) =>
        old.map((c) => (c.id === id ? { ...c, ...patch } : c))
      )

      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['crm_contacts'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_contacts'] })
    },
  })
}
