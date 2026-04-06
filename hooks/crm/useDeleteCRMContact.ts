import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCRMContact } from '@/lib/crm-api'
import type { CRMContact } from '@/types/crm'

export function useDeleteCRMContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCRMContact,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['crm_contacts'] })
      const prev = queryClient.getQueryData<CRMContact[]>(['crm_contacts'])

      queryClient.setQueryData<CRMContact[]>(['crm_contacts'], (old = []) =>
        old.filter((c) => c.id !== id)
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
