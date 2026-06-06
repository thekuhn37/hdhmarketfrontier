import type { MeetingSummaryJob } from './types'

export interface JobIndexItem {
  id: string
  title: string | null
  filename: string
  status: string
  created_at: string
}

export interface JobPage {
  jobs: MeetingSummaryJob[]
  total: number
}

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

export async function listJobs(page = 0): Promise<JobPage> {
  const res = await fetch(`/api/meeting-summary/jobs?page=${page}`)
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json() as Promise<JobPage>
}

export async function searchJobs(q: string, page = 0): Promise<JobPage> {
  const res = await fetch(`/api/meeting-summary/jobs?q=${encodeURIComponent(q)}&page=${page}`)
  if (!res.ok) throw new Error('Failed to search')
  return res.json() as Promise<JobPage>
}

export async function listJobIndex(): Promise<JobIndexItem[]> {
  const res = await fetch('/api/meeting-summary/jobs?index=true')
  if (!res.ok) throw new Error('Failed to fetch index')
  const body = await res.json() as { jobs: JobIndexItem[] }
  return body.jobs
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/meeting-summary/delete/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete job')
}

export async function updateJob(id: string, patch: { title?: string; short_summary?: string }): Promise<void> {
  const res = await fetch(`/api/meeting-summary/update/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update')
}

export async function getAudioUrl(id: string): Promise<string> {
  const res = await fetch(`/api/meeting-summary/audio/${id}`)
  if (!res.ok) throw new Error('Audio not available')
  const body = await res.json() as { url: string }
  return body.url
}

export async function deleteAudio(id: string): Promise<void> {
  const res = await fetch(`/api/meeting-summary/audio/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete audio')
}

export function downloadMinutes(content: string, stem: string, format: 'txt' | 'md' | 'doc'): void {
  if (format === 'doc') {
    // HTML-wrapped Word document — opens correctly in Word / LibreOffice
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><title>${stem}</title>
<style>
  body { font-family: "Malgun Gothic", Arial, sans-serif; font-size: 11pt; margin: 2cm; }
  h1 { font-size: 16pt; border-bottom: 2px solid #000; padding-bottom: 4px; }
  h2 { font-size: 13pt; border-bottom: 1px solid #666; margin-top: 18pt; }
  h3 { font-size: 11pt; margin-top: 12pt; }
  p  { margin: 4pt 0; line-height: 1.6; }
  hr { border: 1px solid #ccc; margin: 12pt 0; }
</style></head><body>
${content
  .split('\n')
  .map(l => {
    if (l.startsWith('## ')) return `<h2>${l.slice(3)}</h2>`
    if (l.startsWith('### ')) return `<h3>${l.slice(4)}</h3>`
    if (l.startsWith('# ')) return `<h1>${l.slice(2)}</h1>`
    if (l === '---') return '<hr/>'
    if (l.trim() === '') return '<p>&nbsp;</p>'
    return `<p>${l.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`
  })
  .join('\n')}
</body></html>`
    const blob = new Blob(['﻿', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${stem}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  }
  downloadText(content, `${stem}.${format}`)
}

export function printMinutesPdf(content: string, title: string): void {
  const win = window.open('', '_blank')
  if (!win) return
  const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif; font-size: 10.5pt; color: #111; }
  h1 { font-size: 15pt; border-bottom: 2px solid #000; padding-bottom: 4px; }
  h2 { font-size: 12pt; border-bottom: 1px solid #555; margin-top: 16pt; color: #1a1a2e; }
  h3 { font-size: 10.5pt; margin-top: 10pt; }
  p  { margin: 3pt 0; line-height: 1.7; }
  hr { border: none; border-top: 1px solid #bbb; margin: 10pt 0; }
  @media print { button { display: none; } }
</style></head><body>
<button onclick="window.print()" style="margin-bottom:16px;padding:6px 16px;cursor:pointer;">PDF로 저장 (인쇄)</button>
${content
  .split('\n')
  .map(l => {
    if (l.startsWith('## ')) return `<h2>${l.slice(3)}</h2>`
    if (l.startsWith('### ')) return `<h3>${l.slice(4)}</h3>`
    if (l.startsWith('# ')) return `<h1>${l.slice(2)}</h1>`
    if (l === '---') return '<hr/>'
    if (l.trim() === '') return '<p>&nbsp;</p>'
    return `<p>${l.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`
  })
  .join('\n')}
</body></html>`
  win.document.write(html)
  win.document.close()
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
