import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PioneerJobPost } from '@/lib/supabase/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', supabase: null }
  return { error: null, supabase, userId: user.id }
}

export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const { data, error: dbErr } = await supabase
    .from('pioneer_job_posts')
    .select('*')
    .eq('soft_deleted', false)
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data as PioneerJobPost[])
}

export async function POST(req: NextRequest) {
  const { error, supabase, userId } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const body = await req.json() as Partial<PioneerJobPost>

  // Deduplication: check source_link first, then company+title
  let existing = null
  if (body.source_link) {
    const { data } = await supabase
      .from('pioneer_job_posts')
      .select('id')
      .eq('source_link', body.source_link)
      .eq('soft_deleted', false)
      .maybeSingle()
    existing = data
  }
  if (!existing && body.company_name && body.position_title) {
    const { data } = await supabase
      .from('pioneer_job_posts')
      .select('id')
      .eq('company_name', body.company_name)
      .eq('position_title', body.position_title)
      .eq('soft_deleted', false)
      .maybeSingle()
    existing = data
  }

  if (existing) {
    const { data, error: upErr } = await supabase
      .from('pioneer_job_posts')
      .update({ ...body, last_checked_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    return NextResponse.json({ job: data as PioneerJobPost, action: 'updated' })
  }

  const { data, error: insErr } = await supabase
    .from('pioneer_job_posts')
    .insert({
      ...body,
      status: body.status ?? 'new',
      required_skills: body.required_skills ?? [],
      preferred_skills: body.preferred_skills ?? [],
      created_by: userId,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ job: data as PioneerJobPost, action: 'created' }, { status: 201 })
}
