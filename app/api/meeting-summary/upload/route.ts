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

  // Parse multipart form
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

  // Create job row in Supabase
  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
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

  // Forward file to FastAPI backend — await the 202 acknowledgment (backend processes async)
  const backendForm = new FormData()
  backendForm.append('file', file)
  backendForm.append('job_id', jobId)

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/meeting-summary/jobs`, {
      method: 'POST',
      body: backendForm,
    })
    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => backendRes.statusText)
      throw new Error(`Backend ${backendRes.status}: ${text}`)
    }
  } catch (err) {
    console.error('[meeting-summary] Backend dispatch failed:', err)
    // Mark job as error so the UI doesn't hang
    await admin.from('meeting_summary_jobs').update({
      status: 'error',
      error_message: `Failed to reach processing backend: ${err instanceof Error ? err.message : String(err)}`,
    }).eq('id', jobId)
    return NextResponse.json({ error: 'Processing backend unavailable. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ job_id: jobId })
}
