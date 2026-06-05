import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

interface Props {
  params: Promise<{ id: string }>
}

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  return { user, admin }
}

// GET — return a signed playback URL (1 hour expiry)
export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user, admin } = ctx

  const { data: job } = await admin
    .from('meeting_summary_jobs')
    .select('audio_storage_path, audio_deleted')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.audio_deleted || !job.audio_storage_path) {
    return NextResponse.json({ error: 'Audio not available' }, { status: 410 })
  }

  const { data: signed, error } = await admin.storage
    .from('meeting-audio')
    .createSignedUrl(job.audio_storage_path, 3600)

  if (error || !signed) return NextResponse.json({ error: 'Failed to generate playback URL' }, { status: 500 })
  return NextResponse.json({ url: signed.signedUrl })
}

// DELETE — remove only the audio file, keep all reports and transcript
export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user, admin } = ctx

  const { data: job } = await admin
    .from('meeting_summary_jobs')
    .select('audio_storage_path, audio_deleted')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (job.audio_storage_path && !job.audio_deleted) {
    const { error: storageErr } = await admin.storage
      .from('meeting-audio')
      .remove([job.audio_storage_path])
    if (storageErr) console.warn('[audio/delete] Storage removal failed:', storageErr.message)
  }

  const { error } = await admin
    .from('meeting_summary_jobs')
    .update({ audio_deleted: true, audio_storage_path: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
