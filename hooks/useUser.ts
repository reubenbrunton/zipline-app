import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  initials: string
  blocked_pages: string[]
}

export function useUser() {
  return useQuery<UserProfile | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const full_name =
        profile?.full_name ??
        user.user_metadata?.full_name ??
        user.email?.split('@')[0] ??
        'User'

      const parts = full_name.trim().split(' ')
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : full_name.slice(0, 2).toUpperCase()

      return {
        id: user.id,
        email: user.email ?? '',
        full_name,
        avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? undefined,
        initials,
        blocked_pages: (profile?.blocked_pages as string[] | null) ?? [],
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
