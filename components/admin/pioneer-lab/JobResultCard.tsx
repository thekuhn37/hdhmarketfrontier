'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink, Trash2, Archive } from 'lucide-react'
import type { PioneerJobPost, JobStatus } from '@/lib/supabase/types'
import { JOB_STATUSES } from '@/lib/pioneer-lab/job-extraction'
import { cn } from '@/lib/utils/cn'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  interesting: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  applied: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  reviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400',
  hiring_completed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

interface Props {
  job: PioneerJobPost
  onUpdate: (id: string, updates: Partial<PioneerJobPost>) => void
  onDelete: (id: string) => void
}

export default function JobResultCard({ job, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [status, setStatus] = useState<JobStatus>(job.status)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/pioneer-lab/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, status }),
    })
    onUpdate(job.id, { notes, status })
    setSaving(false)
  }

  async function archive() {
    await fetch(`/api/pioneer-lab/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    onUpdate(job.id, { status: 'archived' })
  }

  async function del() {
    await fetch(`/api/pioneer-lab/jobs/${job.id}`, { method: 'DELETE' })
    onDelete(job.id)
  }

  const score = job.ai_relevance_score
  const scoreColor = score == null ? 'text-[#9CA3AF]' : score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'

  return (
    <div className={cn(
      'bg-white dark:bg-[#0F172A] rounded-2xl border transition-shadow',
      expanded
        ? 'border-[#38BDF8]/40 shadow-md dark:shadow-[#38BDF8]/5'
        : 'border-[#E5E7EB] dark:border-white/10 hover:shadow-sm hover:border-[#CBD5E1] dark:hover:border-white/20'
    )}>
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <ChevronDown size={16} className={cn('mt-0.5 text-[#9CA3AF] flex-shrink-0 transition-transform', expanded && 'rotate-180')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#0F172A] dark:text-white truncate">{job.position_title || 'Untitled'}</p>
              <p className="text-xs text-[#4B5563] dark:text-slate-400 truncate">{job.company_name || '—'}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', STATUS_COLORS[job.status] ?? STATUS_COLORS.new)}>
                {JOB_STATUSES.find(s => s.value === job.status)?.label ?? job.status}
              </span>
              {score != null && (
                <span className={cn('text-xs font-semibold', scoreColor)}>{score}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {job.location && <span className="text-[10px] text-[#6B7280] dark:text-slate-500">{job.location}</span>}
            {job.company_category && <span className="text-[10px] text-[#6B7280] dark:text-slate-500">{job.company_category}</span>}
            {job.source_platform && <span className="text-[10px] text-[#6B7280] dark:text-slate-500">{job.source_platform}</span>}
            {job.posted_date && <span className="text-[10px] text-[#9CA3AF] dark:text-slate-600">Posted {job.posted_date}</span>}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9] dark:border-white/5 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Detail label="Company" value={job.company_name} />
            <Detail label="Category" value={job.company_category} />
            <Detail label="Position" value={job.position_title} />
            <Detail label="Function" value={job.function_type} />
            <Detail label="Location" value={job.location} />
            <Detail label="Remote" value={job.remote_type} />
            <Detail label="Seniority" value={job.seniority_level} />
            <Detail label="Employment" value={job.employment_type} />
            <Detail label="Salary" value={job.expected_salary} />
            <Detail label="Posted" value={job.posted_date} />
            <Detail label="Closing" value={job.closing_date} />
            <Detail label="Platform" value={job.source_platform} />
          </div>

          {job.job_description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 mb-1">Description</p>
              <p className="text-xs text-[#4B5563] dark:text-slate-300 whitespace-pre-line line-clamp-6">{job.job_description}</p>
            </div>
          )}

          {(job.required_skills?.length > 0 || job.preferred_skills?.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <Skills label="Required Skills" skills={job.required_skills} />
              <Skills label="Preferred Skills" skills={job.preferred_skills} />
            </div>
          )}

          {job.ai_relevance_explanation && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 mb-1">
                AI Relevance — Score {score ?? 'N/A'}
              </p>
              <p className="text-xs text-[#4B5563] dark:text-slate-300 italic">{job.ai_relevance_explanation}</p>
            </div>
          )}

          {job.source_link && (
            <a
              href={job.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] hover:underline"
            >
              <ExternalLink size={12} /> View original posting
            </a>
          )}

          {/* Status + Notes + Actions */}
          <div className="pt-3 border-t border-[#F1F5F9] dark:border-white/5 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as JobStatus)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0B1120] text-xs text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40"
                >
                  {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Personal notes about this opportunity..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0B1120] text-xs text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-xs font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={archive}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-xs text-[#4B5563] dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all flex items-center gap-1"
                >
                  <Archive size={12} /> Archive
                </button>
              </div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 dark:text-red-400">Confirm delete?</span>
                  <button onClick={del} className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700">Yes</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded text-xs border border-[#E5E7EB] dark:border-white/10">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500">{label}</p>
      <p className="text-xs text-[#0F172A] dark:text-white mt-0.5">{value}</p>
    </div>
  )
}

function Skills({ label, skills }: { label: string; skills: string[] }) {
  if (!skills?.length) return null
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {skills.map(s => (
          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-[#F1F5F9] dark:bg-white/5 text-[#4B5563] dark:text-slate-400">{s}</span>
        ))}
      </div>
    </div>
  )
}
