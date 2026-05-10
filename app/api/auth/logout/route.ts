import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const locale = request.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en'
  return NextResponse.redirect(new URL(`/${locale}`, request.url))
}
