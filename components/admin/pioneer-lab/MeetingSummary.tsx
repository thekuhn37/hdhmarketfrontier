'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, ArrowLeft, Upload, X, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Download, Trash2,
  FileAudio, Clock, Globe, RefreshCw,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import {
  uploadAudio, getJobStatus, listJobs, deleteJob,
  downloadText, downloadMinutes, printMinutesPdf,
  formatDuration, formatFileSize,
} from '@/lib/meeting-summary/api'
import type { MeetingSummaryJob, JobStatus } from '@/lib/meeting-summary/types'

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<JobStatus, string> = {
  queued:       'Queued',
  transcribing: 'Transcribing…',
  summarizing:  'Summarizing…',
  complete:     'Complete',
  error:        'Error',
}

const STATUS_COLOR: Record<JobStatus, string> = {
  queued:       'text-[#6B7280] bg-[#F1F5F9] dark:bg-white/10 dark:text-slate-400',
  transcribing: 'text-[#0284C7] bg-[#F0F9FF] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]',
  summarizing:  'text-[#7C3AED] bg-[#F5F3FF] dark:bg-purple-500/10 dark:text-purple-400',
  complete:     'text-[#16A34A] bg-[#F0FDF4] dark:bg-emerald-500/10 dark:text-emerald-400',
  error:        'text-[#DC2626] bg-[#FEF2F2] dark:bg-red-500/10 dark:text-red-400',
}

const ACTIVE_STATUSES: JobStatus[] = ['queued', 'transcribing', 'summarizing']

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
  const isActive = ACTIVE_STATUSES.includes(status)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full', STATUS_COLOR[status])}>
      {isActive && <Loader2 size={10} className="animate-spin" />}
      {status === 'complete' && <CheckCircle2 size={10} />}
      {status === 'error' && <AlertCircle size={10} />}
      {STATUS_LABEL[status]}
    </span>
  )
}

function MarkdownSection({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm text-[#374151] dark:text-slate-300 leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h2 key={i} className="text-base font-bold text-[#0F172A] dark:text-white mt-4 first:mt-0">{line.slice(2)}</h2>
        if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold text-[#0F172A] dark:text-white mt-3">{line.slice(3)}</h3>
        if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-semibold text-[#0F172A] dark:text-slate-200 mt-2 uppercase tracking-wide">{line.slice(4)}</h4>
        if (line === '---') return <hr key={i} className="border-[#E5E7EB] dark:border-white/10 my-2" />
        if (line.startsWith('○ ')) return <div key={i} className="flex gap-2 mt-2"><span className="text-[#38BDF8] font-bold flex-shrink-0">○</span><span className="font-medium text-[#0F172A] dark:text-white">{line.slice(2)}</span></div>
        if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} className="flex gap-2 pl-4"><span className="text-[#38BDF8] flex-shrink-0 mt-0.5">–</span><span>{line.slice(2)}</span></div>
        if (line.match(/^\d+\. /)) return <div key={i} className="flex gap-2 pl-4"><span className="text-[#6B7280] flex-shrink-0 font-mono text-xs mt-0.5">{line.match(/^(\d+)\./)?.[1]}.</span><span>{line.replace(/^\d+\.\s*/, '')}</span></div>
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

function MinutesCard({ job }: { job: MeetingSummaryJob }) {
  const [open, setOpen] = useState(true)
  const stem = `Korean_Meeting_Minutes_${job.created_at.slice(0, 10).replace(/-/g, '')}`

  if (!job.minutes) return null

  return (
    <div className="border-t border-[#F1F5F9] dark:border-white/5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#0F172A] dark:text-white">국문 회의록</span>
          <span className="text-[10px] font-medium text-[#7C3AED] bg-[#F5F3FF] dark:bg-purple-500/10 dark:text-purple-400 px-2 py-0.5 rounded-full">KO</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* TXT */}
          <button
            onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, 'txt') }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10"
            title="Download TXT"
          >
            <Download size={11} /> .txt
          </button>
          {/* MD */}
          <button
            onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, 'md') }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10"
            title="Download Markdown"
          >
            <Download size={11} /> .md
          </button>
          {/* DOCX */}
          <button
            onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, 'doc') }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#7C3AED] transition-colors px-2 py-1 rounded-md hover:bg-[#F5F3FF] dark:hover:bg-purple-500/10"
            title="Download as Word document"
          >
            <Download size={11} /> .doc
          </button>
          {/* PDF */}
          <button
            onClick={e => { e.stopPropagation(); printMinutesPdf(job.minutes!, stem) }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#7C3AED] transition-colors px-2 py-1 rounded-md hover:bg-[#F5F3FF] dark:hover:bg-purple-500/10"
            title="Print / Save as PDF"
          >
            <Download size={11} /> PDF
          </button>
          {open ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="bg-[#FAFAFA] dark:bg-white/5 rounded-xl p-4 border border-[#F5F3FF] dark:border-purple-500/10 max-h-[600px] overflow-y-auto">
            <MarkdownSection content={job.minutes} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({ onUpload, uploading, uploadCount }: { onUpload: (files: File[]) => void; uploading: boolean; uploadCount: number }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (list: FileList | null) => {
    if (!list || uploading) return
    const files = Array.from(list)
    if (files.length > 0) onUpload(files)
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer',
        dragOver
          ? 'border-[#38BDF8] bg-[#F0F9FF] dark:bg-[#38BDF8]/5'
          : 'border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/60 hover:bg-[#F8FAFC] dark:hover:bg-white/5',
        uploading && 'pointer-events-none opacity-60',
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".mp3,.wav,.m4a,.mp4,.aac,.webm,.ogg"
        onChange={e => handleFiles(e.target.files)}
      />
      {uploading
        ? <Loader2 size={32} className="text-[#38BDF8] animate-spin" />
        : <Upload size={32} className="text-[#9CA3AF] dark:text-slate-500" />
      }
      <div className="text-center">
        <p className="text-sm font-medium text-[#0F172A] dark:text-white">
          {uploading
            ? `Uploading ${uploadCount} file${uploadCount > 1 ? 's' : ''}…`
            : 'Drop audio files or click to browse'}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
          MP3, WAV, M4A, MP4, AAC, WebM · Max 200 MB · Multiple files supported
        </p>
      </div>
    </div>
  )
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  onDelete,
  isActive,
}: {
  job: MeetingSummaryJob
  onDelete: (id: string) => void
  isActive: boolean
}) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [showSummary, setShowSummary] = useState(job.status === 'complete')
  const [deleting, setDeleting] = useState(false)

  const stem = job.filename.replace(/\.[^.]+$/, '')

  const handleDelete = async () => {
    if (!confirm(`Delete "${job.filename}" and its results?`)) return
    setDeleting(true)
    try { await onDelete(job.id) } catch { setDeleting(false) }
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] dark:bg-[#38BDF8]/10 flex items-center justify-center flex-shrink-0">
          <FileAudio size={15} className="text-[#38BDF8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">{job.filename}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {job.file_size_bytes && (
              <span className="text-[11px] text-[#6B7280] dark:text-slate-400">{formatFileSize(job.file_size_bytes)}</span>
            )}
            {job.duration_seconds && (
              <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-slate-400">
                <Clock size={10} /> {formatDuration(job.duration_seconds)}
              </span>
            )}
            {job.language_detected && (
              <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-slate-400">
                <Globe size={10} /> {job.language_detected.toUpperCase()}
              </span>
            )}
            <span className="text-[11px] text-[#9CA3AF] dark:text-slate-500">
              {new Date(job.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={job.status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {job.status === 'error' && job.error_message && (
        <div className="mx-5 mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400">{job.error_message}</p>
        </div>
      )}

      {/* Progress bar for active jobs */}
      {isActive && (
        <div className="mx-5 mb-4 h-1 rounded-full bg-[#F1F5F9] dark:bg-white/10 overflow-hidden">
          <div className={cn(
            'h-full rounded-full transition-all duration-1000',
            job.status === 'queued' ? 'w-[10%] bg-[#9CA3AF]' : '',
            job.status === 'transcribing' ? 'w-[45%] bg-[#38BDF8] animate-pulse' : '',
            job.status === 'summarizing' ? 'w-[80%] bg-[#7C3AED] animate-pulse' : '',
          )} />
        </div>
      )}

      {/* Results */}
      {job.status === 'complete' && (
        <div className="border-t border-[#F1F5F9] dark:border-white/5">
          {/* Summary */}
          <div>
            <button
              onClick={() => setShowSummary(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-semibold text-[#0F172A] dark:text-white">Intelligence Report</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); downloadText(job.summary!, `${stem}_report.md`) }}
                  className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10"
                >
                  <Download size={11} /> .md
                </button>
                {showSummary ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
              </div>
            </button>
            {showSummary && (
              <div className="px-5 pb-5">
                <div className="bg-[#F8FAFC] dark:bg-white/5 rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  <MarkdownSection content={job.summary!} />
                </div>
              </div>
            )}
          </div>

          {/* Korean Meeting Minutes */}
          <MinutesCard job={job} />

          {/* Transcript */}
          <div className="border-t border-[#F1F5F9] dark:border-white/5">
            <button
              onClick={() => setShowTranscript(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-semibold text-[#0F172A] dark:text-white">Full Transcript</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); downloadText(job.transcript!, `${stem}_transcript.txt`) }}
                  className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10"
                >
                  <Download size={11} /> .txt
                </button>
                {showTranscript ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
              </div>
            </button>
            {showTranscript && (
              <div className="px-5 pb-5">
                <div className="bg-[#F8FAFC] dark:bg-white/5 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                  <p className="text-xs font-mono text-[#374151] dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {job.transcript}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MeetingSummary() {
  const [jobs, setJobs] = useState<MeetingSummaryJob[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeJobs = jobs.filter(j => ACTIVE_STATUSES.includes(j.status))

  // ── Load job list ────────────────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    try {
      const list = await listJobs()
      setJobs(list)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])

  // ── Poll active jobs ─────────────────────────────────────────────────────

  useEffect(() => {
    if (activeJobs.length === 0) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    pollingRef.current = setInterval(async () => {
      const updates = await Promise.all(
        activeJobs.map(j => getJobStatus(j.id).catch(() => null))
      )
      setJobs(prev => {
        const map = new Map(prev.map(j => [j.id, j]))
        for (const u of updates) if (u) map.set(u.id, u)
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
    }, 3000)

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [activeJobs.map(j => j.id).join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload handler ───────────────────────────────────────────────────────

  const handleUpload = async (files: File[]) => {
    setUploading(true)
    setUploadCount(files.length)
    setUploadError(null)
    const errors: string[] = []

    await Promise.all(files.map(async file => {
      try {
        const { job_id } = await uploadAudio(file)
        setJobs(prev => [{
          id: job_id,
          user_id: '',
          filename: file.name,
          file_size_bytes: file.size,
          duration_seconds: null,
          status: 'queued',
          transcript: null,
          summary: null,
          minutes: null,
          language_detected: null,
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev])
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`)
      }
    }))

    if (errors.length > 0) setUploadError(errors.join(' · '))
    setUploading(false)
    setUploadCount(0)
  }

  // ── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    await deleteJob(id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">

      {/* Back nav */}
      <Link href="/admin/pioneer-lab" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#38BDF8] transition-colors">
        <ArrowLeft size={13} />
        Pioneer Lab
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] flex items-center justify-center flex-shrink-0 shadow-lg">
          <Mic size={22} className="text-[#38BDF8]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">Meeting Summary</h1>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1 max-w-xl">
            Upload a conference or meeting recording — get a full transcript and a structured intelligence report.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <section className="space-y-3">
        <UploadZone onUpload={handleUpload} uploading={uploading} uploadCount={uploadCount} />
        {uploadError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={13} />
            </button>
          </div>
        )}
      </section>

      {/* Job list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white">
            Processing History
            {activeJobs.length > 0 && (
              <span className="ml-2 text-[10px] font-semibold text-[#38BDF8] bg-[#F0F9FF] dark:bg-[#38BDF8]/10 px-2 py-0.5 rounded-full">
                {activeJobs.length} active
              </span>
            )}
          </h2>
          <button
            onClick={loadJobs}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#38BDF8] transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#9CA3AF]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF] dark:text-slate-500">
            <Mic size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No recordings yet. Upload one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={handleDelete}
                isActive={ACTIVE_STATUSES.includes(job.status)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
