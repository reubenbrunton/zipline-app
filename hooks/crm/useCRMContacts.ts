import { useQuery } from '@tanstack/react-query'
import { getCRMContacts } from '@/lib/crm-api'

export function useCRMContacts() {
  return useQuery({
    queryKey: ['crm_contacts'],
    queryFn: getCRMContacts,
  })
}
