import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    // Get the user who just signed in
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      // Check their email is in the whitelist using the service role key
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { data: allowed } = await admin
        .from('allowed_emails')
        .select('email')
        .eq('email', user.email.toLowerCase())
        .maybeSingle()

      if (!allowed) {
        // Not on the whitelist — delete their auth record and block access
        await admin.auth.admin.deleteUser(user.id)
        return NextResponse.redirect(`${origin}/login?error=unauthorized`)
      }
    }

    return response
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
