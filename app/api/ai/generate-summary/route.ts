import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/ai/summary'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verify authentication
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch {
    // Allow in development without Supabase
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { content } = await req.json()
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const summary = await generateSummary(content)
  return NextResponse.json({ summary })
}
