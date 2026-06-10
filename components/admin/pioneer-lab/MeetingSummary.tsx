'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, ArrowLeft, Upload, X, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Download, Trash2,
  FileAudio, Clock, Globe, RefreshCw, Pencil, Play, Pause,
  SkipBack, SkipForward, Volume2, Search, ChevronLeft, ChevronRight,
  List,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import {
  uploadAudio, getJobStatus, deleteJob,
  downloadText, downloadMinutes, printMinutesPdf,
  formatDuration, formatFileSize,
  updateJob, getAudioUrl, deleteAudio,
  listJobs, searchJobs, listJobIndex,
} from '@/lib/meeting-summary/api'
import type { JobIndexItem } from '@/lib/meeting-summary/api'
import type { MeetingSummaryJob, JobStatus } from '@/lib/meeting-summary/types'

const PAGE_SIZE = 10

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
        if (line.startsWith('# '))   return <h2 key={i} className="text-base font-bold text-[#0F172A] dark:text-white mt-4 first:mt-0">{line.slice(2)}</h2>
        if (line.startsWith('## '))  return <h3 key={i} className="text-sm font-semibold text-[#0F172A] dark:text-white mt-3">{line.slice(3)}</h3>
        if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-semibold text-[#0F172A] dark:text-slate-200 mt-2 uppercase tracking-wide">{line.slice(4)}</h4>
        if (line === '---')          return <hr key={i} className="border-[#E5E7EB] dark:border-white/10 my-2" />
        if (line.startsWith('○ '))  return <div key={i} className="flex gap-2 mt-2"><span className="text-[#38BDF8] font-bold flex-shrink-0">○</span><span className="font-medium text-[#0F172A] dark:text-white">{line.slice(2)}</span></div>
        if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} className="flex gap-2 pl-4"><span className="text-[#38BDF8] flex-shrink-0 mt-0.5">–</span><span>{line.slice(2)}</span></div>
        if (line.match(/^\d+\. /))  return <div key={i} className="flex gap-2 pl-4"><span className="text-[#6B7280] flex-shrink-0 font-mono text-xs mt-0.5">{line.match(/^(\d+)\./)?.[1]}.</span><span>{line.replace(/^\d+\.\s*/, '')}</span></div>
        if (line.trim() === '')     return <div key={i} className="h-1" />
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
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60)
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
    if (!audioRef.current || !duration || !isFinite(duration) || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    try { audioRef.current.currentTime = ratio * duration } catch { /* ignore DOMException */ }
  }

  if (audioDeleted) return <p className="text-[11px] text-[#9CA3AF] dark:text-slate-500 italic">Audio file deleted — transcript and reports preserved</p>
  if (urlError) return <p className="text-[11px] text-[#9CA3AF] dark:text-slate-500 italic">Audio unavailable (storage not configured)</p>

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-2">
      <audio ref={audioRef} src={url ?? undefined} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)} />
      <div className="flex items-center gap-2">
        <button onClick={togglePlay} disabled={loadingUrl || !url}
          className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 disabled:opacity-40 flex items-center justify-center text-[#38BDF8] transition-colors flex-shrink-0">
          {loadingUrl ? <Loader2 size={14} className="animate-spin" /> : playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => skip(-10)} disabled={!url} className="flex items-center gap-0.5 text-[10px] text-[#6B7280] hover:text-[#38BDF8] disabled:opacity-40 transition-colors flex-shrink-0" title="Back 10s">
          <SkipBack size={12} />10
        </button>
        <div className="flex-1 h-1.5 bg-[#E5E7EB] dark:bg-white/10 rounded-full relative cursor-pointer group" onClick={seek}>
          <div className="h-full bg-[#38BDF8] rounded-full transition-none" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#38BDF8] rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `clamp(0px, calc(${progress}% - 6px), calc(100% - 12px))` }} />
        </div>
        <button onClick={() => skip(10)} disabled={!url} className="flex items-center gap-0.5 text-[10px] text-[#6B7280] hover:text-[#38BDF8] disabled:opacity-40 transition-colors flex-shrink-0" title="Forward 10s">
          10<SkipForward size={12} />
        </button>
        <span className="text-[11px] text-[#6B7280] dark:text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

// ─── Editable field ───────────────────────────────────────────────────────────

function EditableField({ label, value, placeholder, maxLength, onSave }: {
  label: string; value: string | null | undefined; placeholder: string; maxLength: number; onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!editing) setDraft(value ?? '') }, [value, editing])

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
        <input autoFocus value={draft} maxLength={maxLength} onChange={e => setDraft(e.target.value)}
          onBlur={save} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save() } if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 text-sm bg-transparent border-b border-[#38BDF8] outline-none text-[#0F172A] dark:text-white pb-0.5 min-w-0" />
        {saving && <Loader2 size={12} className="animate-spin text-[#9CA3AF] flex-shrink-0" />}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 w-[5.5rem] flex-shrink-0 pt-0.5">{label}</span>
      <button onClick={() => { setDraft(value ?? ''); setEditing(true) }}
        className="flex-1 text-left text-sm text-[#0F172A] dark:text-white hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors group min-w-0">
        <span className={cn('break-words', !value && 'text-[#9CA3AF] dark:text-slate-500 italic text-xs')}>{value || placeholder}</span>
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
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#0F172A] dark:text-white">국문 회의록</span>
          <span className="text-[10px] font-medium text-[#7C3AED] bg-[#F5F3FF] dark:bg-purple-500/10 dark:text-purple-400 px-2 py-0.5 rounded-full">KO</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['txt', 'md', 'doc'] as const).map(fmt => (
            <button key={fmt} onClick={e => { e.stopPropagation(); downloadMinutes(job.minutes!, stem, fmt) }}
              className={cn('flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors',
                fmt === 'doc' ? 'text-[#6B7280] hover:text-[#7C3AED] hover:bg-[#F5F3FF] dark:hover:bg-purple-500/10'
                              : 'text-[#6B7280] hover:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10')} title={`Download ${fmt}`}>
              <Download size={11} /> .{fmt}
            </button>
          ))}
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
    <div className={cn('relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer',
      dragOver ? 'border-[#38BDF8] bg-[#F0F9FF] dark:bg-[#38BDF8]/5'
               : 'border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/60 hover:bg-[#F8FAFC] dark:hover:bg-white/5',
      uploading && 'pointer-events-none opacity-60')}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}>
      <input ref={inputRef} type="file" multiple className="hidden" accept=".mp3,.wav,.m4a,.mp4,.aac,.webm,.ogg" onChange={e => handleFiles(e.target.files)} />
      {uploading ? <Loader2 size={32} className="text-[#38BDF8] animate-spin" /> : <Upload size={32} className="text-[#9CA3AF] dark:text-slate-500" />}
      <div className="text-center">
        <p className="text-sm font-medium text-[#0F172A] dark:text-white">
          {uploading ? `Uploading ${uploadCount} file${uploadCount > 1 ? 's' : ''}…` : 'Drop audio files or click to browse'}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">MP3, WAV, M4A, MP4, AAC, WebM · Max 200 MB · Multiple files supported</p>
      </div>
    </div>
  )
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({ query, onChange, onSearch, onClear, searching, activeQuery }: {
  query: string; onChange: (v: string) => void; onSearch: (e?: React.FormEvent) => void
  onClear: () => void; searching: boolean; activeQuery: string
}) {
  return (
    <form onSubmit={onSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        <input value={query} onChange={e => onChange(e.target.value)}
          placeholder="Search transcripts, titles, summaries…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#38BDF8] transition-colors" />
      </div>
      {activeQuery && (
        <button type="button" onClick={onClear} title="Clear search"
          className="px-3 py-2.5 bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10 rounded-xl text-[#6B7280] hover:text-[#374151] hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
          <X size={14} />
        </button>
      )}
      <button type="submit" disabled={searching || !query.trim()}
        className="px-4 py-2.5 text-xs font-medium text-white bg-[#38BDF8] hover:bg-[#0EA5E9] disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5">
        {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
        Search
      </button>
    </form>
  )
}

// ─── Index sidebar ────────────────────────────────────────────────────────────

function IndexList({ items, loading, onSelect }: {
  items: JobIndexItem[]; loading: boolean; onSelect: (id: string, page: number) => void
}) {
  const [open, setOpen] = useState(true)
  const complete = items.filter(i => i.status === 'complete')

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-4">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-2 mb-0 group">
        <div className="flex items-center gap-2">
          <List size={13} className="text-[#9CA3AF]" />
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Quick Jump</span>
        </div>
        {open
          ? <ChevronUp size={13} className="text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors" />
          : <ChevronDown size={13} className="text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors" />}
      </button>
      {open && (
        <div className="mt-3">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => <div key={i} className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded animate-pulse" />)}
            </div>
          ) : complete.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] dark:text-slate-500 italic">No completed records yet</p>
          ) : (
            <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {complete.map(item => {
                const pos = items.findIndex(i => i.id === item.id)
                const targetPage = Math.floor(pos / PAGE_SIZE)
                const label = item.title || item.filename.replace(/\.[^.]+$/, '')
                return (
                  <button key={item.id} onClick={() => onSelect(item.id, targetPage)}
                    className="w-full text-left text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white truncate py-1.5 px-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
                    title={label}>
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
  const end = Math.min(totalPages, start + 5)
  const pages = Array.from({ length: end - start }, (_, i) => start + i)
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 0}
        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0F172A] dark:hover:text-white disabled:opacity-30 hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">
        <ChevronLeft size={14} />
      </button>
      {start > 0 && <>
        <button onClick={() => onChange(0)} className="w-7 h-7 text-xs rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">1</button>
        {start > 1 && <span className="text-xs text-[#9CA3AF] px-1">…</span>}
      </>}
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={cn('w-7 h-7 text-xs rounded-lg transition-colors',
            p === page ? 'bg-[#38BDF8] text-white font-medium' : 'text-[#6B7280] hover:bg-[#F1F5F9] dark:hover:bg-white/10')}>
          {p + 1}
        </button>
      ))}
      {end < totalPages && <>
        {end < totalPages - 1 && <span className="text-xs text-[#9CA3AF] px-1">…</span>}
        <button onClick={() => onChange(totalPages - 1)} className="w-7 h-7 text-xs rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">{totalPages}</button>
      </>}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}
        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0F172A] dark:hover:text-white disabled:opacity-30 hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job: initialJob, onDelete, onUpdate,
}: {
  job: MeetingSummaryJob
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<MeetingSummaryJob>) => void
}) {
  const [job, setJob] = useState(initialJob)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingAudio, setDeletingAudio] = useState(false)
  const [showAudioDeleteConfirm, setShowAudioDeleteConfirm] = useState(false)
  const [showFullDeleteConfirm, setShowFullDeleteConfirm] = useState(false)

  useEffect(() => { setJob(initialJob) }, [initialJob])

  const stem = job.filename.replace(/\.[^.]+$/, '')
  const isActive = ACTIVE_STATUSES.includes(job.status)
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
    <div id={`job-${job.id}`} className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] dark:bg-[#38BDF8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileAudio size={15} className="text-[#38BDF8]" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-[#6B7280] dark:text-slate-400 truncate">{job.filename}</p>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {job.file_size_bytes && <span className="text-[11px] text-[#9CA3AF] dark:text-slate-500">{formatFileSize(job.file_size_bytes)}</span>}
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
            <span className="text-[11px] text-[#9CA3AF] dark:text-slate-500">{new Date(job.created_at).toLocaleString()}</span>
          </div>
        </div>
        {/* X — delete entire meeting */}
        {showFullDeleteConfirm ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-[#6B7280] dark:text-slate-400">Delete everything?</span>
            <button onClick={handleFullDelete} className="text-[10px] font-semibold text-red-600 px-2 py-1 rounded bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors">Delete</button>
            <button onClick={() => setShowFullDeleteConfirm(false)} className="text-[10px] text-[#6B7280] px-2 py-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowFullDeleteConfirm(true)} disabled={deleting}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0" title="Delete entire meeting">
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
          <div className={cn('h-full rounded-full transition-all duration-1000',
            job.status === 'queued'       && 'w-[10%] bg-[#9CA3AF]',
            job.status === 'transcribing' && 'w-[45%] bg-[#38BDF8] animate-pulse',
            job.status === 'summarizing'  && 'w-[80%] bg-[#7C3AED] animate-pulse')} />
        </div>
      )}

      {/* ── Audio player — sticky so it stays visible while reading reports ── */}
      {(hasAudio || job.audio_deleted) && (
        <div className="sticky top-4 z-10 px-5 pb-3 pt-0 bg-white dark:bg-[#0F172A] rounded-2xl">
          <div className="bg-[#F8FAFC] dark:bg-white/5 rounded-xl px-4 py-3 border border-[#E5E7EB] dark:border-white/10 space-y-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-slate-400">
              <Volume2 size={11} /> Audio
            </div>
            <AudioPlayer jobId={job.id} audioDeleted={job.audio_deleted ?? false} />
          </div>
        </div>
      )}

      {/* ── Title + Summary + audio-only delete ────────────────── */}
      {job.status === 'complete' && (
        <div className="px-5 pb-4 space-y-2.5">
          <EditableField label="Title" value={job.title} placeholder="Click to add a title…" maxLength={200} onSave={handleSaveTitle} />
          <EditableField label="Summary" value={job.short_summary} placeholder="Click to add a summary…" maxLength={250} onSave={handleSaveShortSummary} />
          {hasAudio && (
            <div className="flex justify-end pt-0.5">
              {showAudioDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280] dark:text-slate-400">Delete original audio?</span>
                  <button onClick={() => setShowAudioDeleteConfirm(false)} className="text-xs text-[#6B7280] px-2.5 py-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={handleDeleteAudio} disabled={deletingAudio}
                    className="text-xs font-medium text-red-600 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                    {deletingAudio ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Delete Audio
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAudioDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">
                  <Trash2 size={11} /> Delete Audio File
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Reports ────────────────────────────────────────────── */}
      {job.status === 'complete' && (
        <div className="border-t border-[#F1F5F9] dark:border-white/5">
          {/* Intelligence Report */}
          <div>
            <button onClick={() => setShowSummary(v => !v)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
              <span className="text-xs font-semibold text-[#0F172A] dark:text-white">Intelligence Report</span>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); downloadText(job.summary!, `${stem}_report.md`) }}
                  className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10">
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
            <button onClick={() => setShowTranscript(v => !v)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
              <span className="text-xs font-semibold text-[#0F172A] dark:text-white">Full Transcript</span>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); downloadText(job.transcript!, `${stem}_transcript.txt`) }}
                  className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#38BDF8] transition-colors px-2 py-1 rounded-md hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10">
                  <Download size={11} /> .txt
                </button>
                {showTranscript ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
              </div>
            </button>
            {showTranscript && (
              <div className="px-5 pb-5">
                <div className="bg-[#F8FAFC] dark:bg-white/5 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                  <p className="text-xs font-mono text-[#374151] dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{job.transcript}</p>
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
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [indexItems, setIndexItems] = useState<JobIndexItem[]>([])
  const [indexLoading, setIndexLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingScrollRef = useRef<string | null>(null)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const activeJobs = jobs.filter(j => ACTIVE_STATUSES.includes(j.status))

  // ── Data fetchers ────────────────────────────────────────────

  const loadPage = useCallback(async (p: number, q = '') => {
    try {
      const result = q ? await searchJobs(q, p) : await listJobs(p)
      setJobs(result.jobs)
      setTotal(result.total)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }, [])

  const loadIndex = useCallback(async () => {
    try {
      const items = await listJobIndex()
      setIndexItems(items)
    } catch {
      // silent
    } finally {
      setIndexLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPage(0)
    loadIndex()
  }, [loadPage, loadIndex])

  // Scroll to job after page navigation
  useEffect(() => {
    if (pendingScrollRef.current && jobs.some(j => j.id === pendingScrollRef.current)) {
      const el = document.getElementById(`job-${pendingScrollRef.current}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        pendingScrollRef.current = null
      }
    }
  }, [jobs])

  // ── Polling ──────────────────────────────────────────────────

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
      if (updates.some(u => u?.status === 'complete')) loadIndex()
    }, 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [activeJobs.map(j => j.id).join(','), loadIndex])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setActiveSearch(q)
    setPage(0)
    setLoading(true)
    setSearching(true)
    await loadPage(0, q)
  }

  const handleClearSearch = async () => {
    setSearchQuery('')
    setActiveSearch('')
    setPage(0)
    setLoading(true)
    await loadPage(0, '')
  }

  const handlePageChange = async (newPage: number) => {
    setPage(newPage)
    setLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    await loadPage(newPage, activeSearch)
  }

  const handleIndexSelect = async (jobId: string, targetPage: number) => {
    if (activeSearch) {
      setSearchQuery('')
      setActiveSearch('')
    }
    pendingScrollRef.current = jobId
    if (targetPage !== page || activeSearch) {
      setPage(targetPage)
      setLoading(true)
      await loadPage(targetPage, '')
    } else {
      document.getElementById(`job-${jobId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      pendingScrollRef.current = null
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const result = activeSearch ? await searchJobs(activeSearch, page) : await listJobs(page)
      setJobs(result.jobs)
      setTotal(result.total)
      await loadIndex()
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpload = async (files: File[]) => {
    setUploading(true)
    setUploadCount(files.length)
    setUploadError(null)
    const errors: string[] = []
    await Promise.all(files.map(async file => {
      try { await uploadAudio(file) }
      catch (err) { errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`) }
    }))
    if (errors.length > 0) setUploadError(errors.join(' · '))
    setUploading(false)
    setUploadCount(0)
    // Navigate to page 0 to show newly uploaded jobs
    setPage(0)
    setSearchQuery('')
    setActiveSearch('')
    setLoading(true)
    await loadPage(0, '')
    await loadIndex()
  }

  const handleDelete = async (id: string) => {
    await deleteJob(id)
    const newTotal = total - 1
    const maxPage = Math.max(0, Math.ceil(newTotal / PAGE_SIZE) - 1)
    const targetPage = Math.min(page, maxPage)
    setPage(targetPage)
    await loadPage(targetPage, activeSearch)
    await loadIndex()
  }

  const handleUpdate = (id: string, patch: Partial<MeetingSummaryJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
    if ('title' in patch) {
      setIndexItems(prev => prev.map(i => i.id === id ? { ...i, title: (patch.title as string | null | undefined) ?? null } : i))
    }
  }

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-6">

      {/* Back nav */}
      <Link href="/admin/pioneer-lab" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#38BDF8] transition-colors">
        <ArrowLeft size={13} /> Pioneer Lab
      </Link>

      {/* Header */}
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

      {/* Upload zone */}
      <div className="space-y-3">
        <UploadZone onUpload={handleUpload} uploading={uploading} uploadCount={uploadCount} />
        {uploadError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={13} /></button>
          </div>
        )}
      </div>

      {/* Mobile index list — between upload and search */}
      <div className="lg:hidden">
        <IndexList items={indexItems} loading={indexLoading} onSelect={handleIndexSelect} />
      </div>

      {/* Search bar */}
      <SearchBar
        query={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        onClear={handleClearSearch}
        searching={searching}
        activeQuery={activeSearch}
      />

      {/* Two-column layout: job list left, index sidebar right */}
      <div className="flex gap-6 items-start">

        {/* ── Main column ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* History header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                {activeSearch ? `Results for "${activeSearch}"` : 'Processing History'}
              </h2>
              {activeJobs.length > 0 && (
                <span className="text-[10px] font-semibold text-[#38BDF8] bg-[#F0F9FF] dark:bg-[#38BDF8]/10 px-2 py-0.5 rounded-full">
                  {activeJobs.length} active
                </span>
              )}
              {activeSearch && total > 0 && (
                <span className="text-[10px] text-[#6B7280] dark:text-slate-400">{total} found</span>
              )}
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#38BDF8] disabled:opacity-50 transition-colors">
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

          {/* Job list */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#9CA3AF]" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF] dark:text-slate-500">
              <Mic size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {activeSearch ? `No records matched "${activeSearch}"` : 'No recordings yet. Upload one above to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />

        </div>

        {/* ── Desktop index sidebar ─────────────────────────────── */}
        <div className="hidden lg:block w-52 flex-shrink-0 sticky top-6">
          <IndexList items={indexItems} loading={indexLoading} onSelect={handleIndexSelect} />
        </div>

      </div>
    </div>
  )
}
