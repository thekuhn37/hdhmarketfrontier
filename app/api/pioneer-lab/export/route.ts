import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJobExcel } from '@/lib/pioneer-lab/job-export'
import type { PioneerJobPost } from '@/lib/supabase/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('pioneer_job_posts')
    .select('*')
    .eq('soft_deleted', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const buffer = generateJobExcel(data as PioneerJobPost[])
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="job_market_today_${date}.xlsx"`,
    },
  })
}
