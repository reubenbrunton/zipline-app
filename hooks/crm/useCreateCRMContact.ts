import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCRMContact } from '@/lib/crm-api'
import type { CRMContact } from '@/types/crm'

export function useCreateCRMContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCRMContact,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['crm_contacts'] })
      const prev = queryClient.getQueryData<CRMContact[]>(['crm_contacts'])

      const optimistic: CRMContact = {
        id: 'temp-' + Date.now(),
        company: input.company,
        logo_initials: input.company.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''),
        logo_color: input.logo_color ?? '#6366F1',
        contact: input.contact,
        phone: input.phone,
        email: input.email,
        website: input.website,
        pipeline_stage: input.pipeline_stage ?? 'New Lead',
        service: input.service,
        deal_value: input.deal_value,
        description: input.description,
        location: input.location,
        tags: input.tags ?? [],
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<CRMContact[]>(['crm_contacts'], (old = []) => [...old, optimistic])
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
