'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, ArrowLeft, Upload, X, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Download, Trash2,
  FileAudio, Clock, Globe, RefreshCw, Pencil, Play, Pause,
  SkipBack, SkipForward, Volume2,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import {
  uploadAudio, getJobStatus, listJobs, deleteJob,
  downloadText, downloadMinutes, printMinutesPdf,
  formatDuration, formatFileSize,
  updateJob, getAudioUrl, deleteAudio,
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

// ─── Status badge ─────────────────────────────────────────────────────────────

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

// ─── Markdown renderer ────────────────────────────────────────────────────────

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

// ─── Audio player ─────────────────────────────────────────────────────────────

function AudioPlayer({ jobId, audioDeleted }: { jobId: string; audioDeleted: boolean }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Pre-fetch the signed URL on mount so play is instant
  useEffect(() => {
    if (audioDeleted) return
    setLoadingUrl(true)
    getAudioUrl(jobId)
      .then(u => setUrl(u))
      .catch(() => setUrlError(true))
      .finally(() => setLoadingUrl(false))
  }, [jobId, audioDeleted])

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (!audioRef.current || !url) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play().catch(() => {})
  }

  const skip = (delta: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, Math.min(duration || 0, currentTime + delta))
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  if (audioDeleted) {
    return (
      <p className="text-[11px] text-[#9CA3AF] dark:text-slate-500 italic">
        Audio file deleted — transcript and reports preserved
      </p>
    )
  }

  if (urlError) {
    return (
      <p className="text-[11px] text-[#9CA3AF] dark:text-slate-500 italic">
        Audio unavailable (storage not configured)
      </p>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        src={url ?? undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
      />

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={loadingUrl || !url}
          className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 disabled:opacity-40 flex items-center justify-center text-[#38BDF8] transition-colors flex-shrink-0"
          title={playing ? 'Pause' : 'Play'}
        >
          {loadingUrl
            ? <Loader2 size={14} className="animate-spin" />
            : playing
              ? <Pause size={14} />
              : <Play size={14} />}
        </button>

        {/* Skip back */}
        <button
          onClick={() => skip(-10)}
          disabled={!url}
          className="flex items-center gap-0.5 text-[10px] text-[#6B7280] hover:text-[#38BDF8] disabled:opacity-40 transition-colors flex-shrink-0"
          title="Back 10s"
        >
          <SkipBack size={12} />10
        </button>

        {/* Seek bar */}
        <div
          className="flex-1 h-1.5 bg-[#E5E7EB] dark:bg-white/10 rounded-full relative cursor-pointer group"
          onClick={seek}
          title="Seek"
        >
          <div
            className="h-full bg-[#38BDF8] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#38BDF8] rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Skip forward */}
        <button
          onClick={() => skip(10)}
          disabled={!url}
          className="flex items-center gap-0.5 text-[10px] text-[#6B7280] hover:text-[#38BDF8] disabled:opacity-40 transition-colors flex-shrink-0"
          title="Forward 10s"
        >
          10<SkipForward size={12} />
        </button>

        {/* Time */}
        <span className="text-[11px] text-[#6B7280] dark:text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

// ─── Editable field ───────────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  placeholder,
  maxLength,
  onSave,
}: {
  label: string
  value: string | null | undefined
  placeholder: string
  maxLength: number
  onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  // Sync if parent value changes (e.g. after polling update)
  useEffect(() => {
    if (!editing) setDraft(value ?? '')
  }, [value, editing])

  const save = async () => {
    const trimmed = draft.trim()
    if (trimmed === (value ?? '').trim()) { setEditing(false); return }
    setSaving(true)
    try { await onSave(trimmed) } finally { setSaving(false); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 w-[5.5rem] flex-shrink-0">{label}</span>
        <input
          autoFocus
          value={draft}
          maxLength={maxLength}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save() } if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 text-sm bg-transparent border-b border-[#38BDF8] outline-none text-[#0F172A] dark:text-white pb-0.5 min-w-0"
        />
        {saving && <Loader2 size={12} className="animate-spin text-[#9CA3AF] flex-shrink-0" />}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 w-[5.5rem] flex-shrink-0 pt-0.5">{label}</span>
      <button
        onClick={() => { setDraft(value ?? ''); setEditing(true) }}
        className="flex-1 text-left text-sm text-[#0F172A] dark:text-white hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors group min-w-0"
      >
        <span className={cn('break-words', !value && 'text-[#9CA3AF] dark:text-slate-500 italic text-xs')}>
          {value || placeholder}
        </span>
        <Pencil size={11} className="inline ml-1.5 opacity-0 group-hover:opacity-60 text-[#9CA3AF] transition-opacity flex-shrink-0" />
      </button>
    </div>
  )
}

// ─── Minutes card ─────────────────────────────────────────────────────────────

function MinutesCard({ job }: { job: MeetingSummaryJob }) {
  const [open, setOpen] = useState(false)
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
          <button onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, 'txt') }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10" title="Download TXT">
            <Download size={11} /> .txt
          </button>
          <button onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, 'md') }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10" title="Download Markdown">
            <Download size={11} /> .md
          </button>
          <button onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, 'doc') }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#7C3AED] transition-colors px-2 py-1 rounded-md hover:bg-[#F5F3FF] dark:hover:bg-purple-500/10" title="Download as Word">
            <Download size={11} /> .doc
          </button>
          <button onClick={e => { e.stopPropagation(); printMinutesPdf(job.minutes!, stem) }}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#7C3AED] transition-colors px-2 py-1 rounded-md hover:bg-[#F5F3FF] dark:hover:bg-purple-500/10" title="Print / Save as PDF">
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
      <input ref={inputRef} type="file" multiple className="hidden" accept=".mp3,.wav,.m4a,.mp4,.aac,.webm,.ogg" onChange={e => handleFiles(e.target.files)} />
      {uploading ? <Loader2 size={32} className="text-[#38BDF8] animate-spin" /> : <Upload size={32} className="text-[#9CA3AF] dark:text-slate-500" />}
      <div className="text-center">
        <p className="text-sm font-medium text-[#0F172A] dark:text-white">
          {uploading ? `Uploading ${uploadCount} file${uploadCount > 1 ? 's' : ''}…` : 'Drop audio files or click to browse'}
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
  job: initialJob,
  onDelete,
  onUpdate,
  isActive,
}: {
  job: MeetingSummaryJob
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<MeetingSummaryJob>) => void
  isActive: boolean
}) {
  const [job, setJob] = useState(initialJob)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingAudio, setDeletingAudio] = useState(false)
  const [showAudioDeleteConfirm, setShowAudioDeleteConfirm] = useState(false)
  const [showFullDeleteConfirm, setShowFullDeleteConfirm] = useState(false)

  // Keep local state in sync when parent polls new data
  useEffect(() => { setJob(initialJob) }, [initialJob])

  const stem = job.filename.replace(/\.[^.]+$/, '')
  const hasAudio = !!job.audio_storage_path && !job.audio_deleted

  const handleSaveTitle = async (title: string) => {
    await updateJob(job.id, { title })
    const patch = { title }
    setJob(j => ({ ...j, ...patch }))
    onUpdate(job.id, patch)
  }

  const handleSaveShortSummary = async (short_summary: string) => {
    await updateJob(job.id, { short_summary })
    const patch = { short_summary }
    setJob(j => ({ ...j, ...patch }))
    onUpdate(job.id, patch)
  }

  const handleFullDelete = async () => {
    setShowFullDeleteConfirm(false)
    setDeleting(true)
    try { await onDelete(job.id) } catch { setDeleting(false) }
  }

  const handleDeleteAudio = async () => {
    setShowAudioDeleteConfirm(false)
    setDeletingAudio(true)
    try {
      await deleteAudio(job.id)
      const patch = { audio_deleted: true, audio_storage_path: null }
      setJob(j => ({ ...j, ...patch }))
      onUpdate(job.id, patch)
    } finally {
      setDeletingAudio(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] dark:bg-[#38BDF8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileAudio size={15} className="text-[#38BDF8]" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {/* Filename row */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-[#6B7280] dark:text-slate-400 truncate">{job.filename}</p>
            <StatusBadge status={job.status} />
          </div>
          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {job.file_size_bytes && (
              <span className="text-[11px] text-[#9CA3AF] dark:text-slate-500">{formatFileSize(job.file_size_bytes)}</span>
            )}
            {job.duration_seconds && (
              <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] dark:text-slate-500">
                <Clock size={10} /> {formatDuration(job.duration_seconds)}
              </span>
            )}
            {job.language_detected && (
              <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] dark:text-slate-500">
                <Globe size={10} /> {job.language_detected.toUpperCase()}
              </span>
            )}
            <span className="text-[11px] text-[#9CA3AF] dark:text-slate-500">
              {new Date(job.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Delete entire meeting — top right X */}
        {showFullDeleteConfirm ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-[#6B7280] dark:text-slate-400">Delete everything?</span>
            <button onClick={handleFullDelete} className="text-[10px] font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 dark:bg-red-500/10 transition-colors">Delete</button>
            <button onClick={() => setShowFullDeleteConfirm(false)} className="text-[10px] text-[#6B7280] hover:text-[#374151] px-2 py-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowFullDeleteConfirm(true)}
            disabled={deleting}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
            title="Delete entire meeting"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          </button>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {job.status === 'error' && job.error_message && (
        <div className="mx-5 mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400">{job.error_message}</p>
        </div>
      )}

      {/* ── Progress bar ───────────────────────────────────────── */}
      {isActive && (
        <div className="mx-5 mb-3 h-1 rounded-full bg-[#F1F5F9] dark:bg-white/10 overflow-hidden">
          <div className={cn(
            'h-full rounded-full transition-all duration-1000',
            job.status === 'queued'       && 'w-[10%] bg-[#9CA3AF]',
            job.status === 'transcribing' && 'w-[45%] bg-[#38BDF8] animate-pulse',
            job.status === 'summarizing'  && 'w-[80%] bg-[#7C3AED] animate-pulse',
          )} />
        </div>
      )}

      {/* ── Audio player + metadata ────────────────────────────── */}
      {(hasAudio || job.audio_deleted) && (
        <div className="px-5 pb-4 space-y-3">
          {/* Audio player */}
          <div className="bg-[#F8FAFC] dark:bg-white/5 rounded-xl px-4 py-3 border border-[#E5E7EB] dark:border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-slate-400">
              <Volume2 size={11} /> Audio
            </div>
            <AudioPlayer jobId={job.id} audioDeleted={job.audio_deleted ?? false} />
          </div>
        </div>
      )}

      {/* ── Title + Short summary ──────────────────────────────── */}
      {job.status === 'complete' && (
        <div className="px-5 pb-4 space-y-2.5">
          <EditableField
            label="Title"
            value={job.title}
            placeholder="Click to add a title…"
            maxLength={200}
            onSave={handleSaveTitle}
          />
          <EditableField
            label="Summary"
            value={job.short_summary}
            placeholder="Click to add a one-line summary…"
            maxLength={100}
            onSave={handleSaveShortSummary}
          />
        </div>
      )}

      {/* ── Reports (complete only) ────────────────────────────── */}
      {job.status === 'complete' && (
        <div className="border-t border-[#F1F5F9] dark:border-white/5">

          {/* Intelligence Report */}
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

          {/* Full Transcript */}
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

          {/* Audio-only delete — bottom of complete card */}
          {hasAudio && (
            <div className="border-t border-[#F1F5F9] dark:border-white/5 px-5 py-3">
              {showAudioDeleteConfirm ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs text-[#374151] dark:text-slate-300">
                    Delete original audio? Transcript and reports will remain.
                  </p>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setShowAudioDeleteConfirm(false)} className="text-xs text-[#6B7280] hover:text-[#374151] px-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={handleDeleteAudio} disabled={deletingAudio} className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                      {deletingAudio ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      Delete Audio
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAudioDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} /> Delete Audio File
                </button>
              )}
            </div>
          )}
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
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeJobs = jobs.filter(j => ACTIVE_STATUSES.includes(j.status))

  const loadJobs = useCallback(async () => {
    try {
      const list = await listJobs()
      setJobs(list)
    } catch {
      // silent on initial load — page still shows empty state
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const list = await listJobs()
      setJobs(list)
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { loadJobs() }, [loadJobs])

  useEffect(() => {
    if (activeJobs.length === 0) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    pollingRef.current = setInterval(async () => {
      const updates = await Promise.all(activeJobs.map(j => getJobStatus(j.id).catch(() => null)))
      setJobs(prev => {
        const map = new Map(prev.map(j => [j.id, j]))
        for (const u of updates) if (u) map.set(u.id, u)
        return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      })
    }, 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [activeJobs.map(j => j.id).join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

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
          title: null,
          short_summary: null,
          audio_storage_path: null,
          audio_deleted: false,
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

  const handleDelete = async (id: string) => {
    await deleteJob(id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const handleUpdate = (id: string, patch: Partial<MeetingSummaryJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <Link href="/admin/pioneer-lab" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#38BDF8] transition-colors">
        <ArrowLeft size={13} /> Pioneer Lab
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] flex items-center justify-center flex-shrink-0 shadow-lg">
          <Mic size={22} className="text-[#38BDF8]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">Meeting Summary</h1>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1 max-w-xl">
            Upload a conference or meeting recording — get a full transcript, intelligence report, and Korean meeting minutes.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <UploadZone onUpload={handleUpload} uploading={uploading} uploadCount={uploadCount} />
        {uploadError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={13} /></button>
          </div>
        )}
      </section>

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
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#38BDF8] disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {refreshError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">Refresh failed: {refreshError}</p>
            <button onClick={() => setRefreshError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={13} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#9CA3AF]" /></div>
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
                onUpdate={handleUpdate}
                isActive={ACTIVE_STATUSES.includes(job.status)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
