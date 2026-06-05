import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const BACKEND_URL = process.env.NEXT_PUBLIC_LICENSE_POLICY_API_BASE_URL?.replace(/\/$/, '')
const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.webm', '.ogg'])
const MAX_BYTES = 200 * 1024 * 1024 // 200 MB

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!BACKEND_URL) {
    return NextResponse.json({ error: 'Backend not configured' }, { status: 503 })
  }

  // Parse multipart form and read bytes once (shared between storage upload and backend)
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = '.' + file.name.split('.').pop()!.toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `Unsupported format: ${ext}` }, { status: 415 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (${Math.round(file.size / 1e6)} MB). Max 200 MB.` }, { status: 413 })
  }

  const fileBytes = await file.arrayBuffer()

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Create job row in Supabase
  const { data: job, error: insertErr } = await admin
    .from('meeting_summary_jobs')
    .insert({
      user_id: user.id,
      filename: file.name,
      file_size_bytes: file.size,
      status: 'queued',
    })
    .select('id')
    .single()

  if (insertErr || !job) {
    return NextResponse.json({ error: 'Failed to create job record' }, { status: 500 })
  }

  const jobId = job.id as string
  const storagePath = `${user.id}/${jobId}/${file.name}`

  // Build backend form (reuse same bytes)
  const backendForm = new FormData()
  backendForm.append('file', new Blob([fileBytes], { type: file.type || 'audio/mpeg' }), file.name)
  backendForm.append('job_id', jobId)

  // Run storage upload and backend dispatch in parallel
  const [storageResult, backendResult] = await Promise.allSettled([
    admin.storage
      .from('meeting-audio')
      .upload(storagePath, fileBytes, { contentType: file.type || 'audio/mpeg', upsert: false }),
    fetch(`${BACKEND_URL}/api/meeting-summary/jobs`, { method: 'POST', body: backendForm }),
  ])

  // Storage failure is non-fatal — audio player just won't be available
  if (storageResult.status === 'fulfilled' && !storageResult.value.error) {
    await admin
      .from('meeting_summary_jobs')
      .update({ audio_storage_path: storagePath })
      .eq('id', jobId)
  } else if (storageResult.status === 'rejected' || storageResult.value.error) {
    console.warn('[meeting-summary] Storage upload failed for job', jobId, storageResult.status === 'rejected' ? storageResult.reason : storageResult.value.error)
  }

  // Backend failure IS fatal
  if (backendResult.status === 'rejected' || !backendResult.value.ok) {
    const detail = backendResult.status === 'rejected'
      ? String(backendResult.reason)
      : await backendResult.value.text().catch(() => backendResult.value.statusText)
    console.error('[meeting-summary] Backend dispatch failed:', detail)
    await admin.from('meeting_summary_jobs').update({
      status: 'error',
      error_message: `Failed to reach processing backend: ${detail}`,
    }).eq('id', jobId)
    return NextResponse.json({ error: 'Processing backend unavailable. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ job_id: jobId })
}
