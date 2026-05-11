import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const locale = searchParams.get('locale') ?? 'en'

  const supabase = await createClient()

  if (token_hash && type) {
    // Email-based flows: password reset, magic link, email confirmation
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
    })
    if (error) return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_failed`)

    // Password recovery: go directly to profile security section, already authenticated
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/${locale}/profile?recovery=true`)
    }
  } else if (code) {
    // OAuth PKCE flow (Google, etc.)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_failed`)
  } else {
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(`${origin}/${locale}/onboarding`)
    }
  }

  const nextPath = next.startsWith('/') ? next : `/${next}`
  return NextResponse.redirect(`${origin}/${locale}${nextPath}`)
}
