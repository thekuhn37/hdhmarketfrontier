import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { MeetingSummaryJob } from '@/lib/meeting-summary/types'

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))
  const indexMode = searchParams.get('index') === 'true'

  // Lightweight index mode: all jobs, minimal columns, for the sidebar
  if (indexMode) {
    const { data, error } = await admin
      .from('meeting_summary_jobs')
      .select('id, title, filename, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ jobs: data })
  }

  // Build paginated (or search) query
  let query = admin
    .from('meeting_summary_jobs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (q) {
    // Sanitise to prevent injection in ilike pattern
    const safe = q.replace(/%/g, '\\%').replace(/_/g, '\\_')
    query = query.or(
      `title.ilike.%${safe}%,short_summary.ilike.%${safe}%,transcript.ilike.%${safe}%`
    )
  }

  const { data, error, count } = await query.range(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE - 1,
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data as MeetingSummaryJob[], total: count ?? 0 })
}
