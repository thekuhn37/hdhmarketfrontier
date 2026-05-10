import { NextRequest, NextResponse } from 'next/server'
import { generatePostFields } from '@/lib/ai/summary'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { content, field } = await req.json()
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const fields = await generatePostFields(content)

  // If a specific field was requested, return only that
  if (field && field in fields) {
    return NextResponse.json({ [field]: fields[field as keyof typeof fields] })
  }

  return NextResponse.json(fields)
}
