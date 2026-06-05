import type { MeetingSummaryJob } from './types'

export async function uploadAudio(file: File): Promise<{ job_id: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/meeting-summary/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error: string }
    throw new Error(body.error || 'Upload failed')
  }
  return res.json() as Promise<{ job_id: string }>
}

export async function getJobStatus(id: string): Promise<MeetingSummaryJob> {
  const res = await fetch(`/api/meeting-summary/status/${id}`)
  if (!res.ok) throw new Error('Failed to fetch job status')
  return res.json() as Promise<MeetingSummaryJob>
}

export async function listJobs(): Promise<MeetingSummaryJob[]> {
  const res = await fetch('/api/meeting-summary/jobs')
  if (!res.ok) throw new Error('Failed to fetch jobs')
  const body = await res.json() as { jobs: MeetingSummaryJob[] }
  return body.jobs
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/meeting-summary/delete/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete job')
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}
