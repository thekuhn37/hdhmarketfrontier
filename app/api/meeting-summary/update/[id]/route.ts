import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { title?: string; short_summary?: string }
  const patch: Record<string, string | null> = {}
  if ('title' in body) patch.title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : null
  if ('short_summary' in body) patch.short_summary = typeof body.short_summary === 'string' ? body.short_summary.trim().slice(0, 100) : null
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  patch.updated_at = new Date().toISOString()

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await admin
    .from('meeting_summary_jobs')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
