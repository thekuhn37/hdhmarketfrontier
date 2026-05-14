import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractJobFromText } from '@/lib/pioneer-lab/job-extraction'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    rawText: string
    sourceUrl?: string
    sourcePlatform?: string
    keywords?: string
  }

  if (!body.rawText || body.rawText.trim().length < 20) {
    return NextResponse.json({ error: 'Job text is too short to extract data from.' }, { status: 400 })
  }
  if (body.rawText.length > 30000) {
    return NextResponse.json({ error: 'Input too large. Please trim to under 30,000 characters.' }, { status: 400 })
  }

  const extracted = await extractJobFromText(
    body.rawText,
    body.sourceUrl,
    body.sourcePlatform,
    body.keywords,
  )

  return NextResponse.json(extracted)
}
