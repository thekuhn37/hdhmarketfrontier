import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PioneerJobPost } from '@/lib/supabase/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', supabase: null }
  return { error: null, supabase }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const { id } = await params
  const body = await req.json() as Partial<PioneerJobPost>

  const safeUpdate = {
    ...(body.status !== undefined && { status: body.status }),
    ...(body.notes !== undefined && { notes: body.notes }),
    ...(body.company_name !== undefined && { company_name: body.company_name }),
    ...(body.company_category !== undefined && { company_category: body.company_category }),
    ...(body.position_title !== undefined && { position_title: body.position_title }),
    ...(body.function_type !== undefined && { function_type: body.function_type }),
    ...(body.job_description !== undefined && { job_description: body.job_description }),
    ...(body.expected_salary !== undefined && { expected_salary: body.expected_salary }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.posted_date !== undefined && { posted_date: body.posted_date }),
    ...(body.closing_date !== undefined && { closing_date: body.closing_date }),
    ...(body.remote_type !== undefined && { remote_type: body.remote_type }),
    ...(body.seniority_level !== undefined && { seniority_level: body.seniority_level }),
    ...(body.soft_deleted !== undefined && { soft_deleted: body.soft_deleted, deleted_at: body.soft_deleted ? new Date().toISOString() : null }),
    last_checked_at: new Date().toISOString(),
  }

  const { data, error: dbErr } = await supabase
    .from('pioneer_job_posts')
    .update(safeUpdate)
    .eq('id', id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data as PioneerJobPost)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const { id } = await params

  const { error: dbErr } = await supabase
    .from('pioneer_job_posts')
    .update({ soft_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
