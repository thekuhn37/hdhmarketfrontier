'use client'

import { ExternalLink, Pencil } from 'lucide-react'
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
  jobs: PioneerJobPost[]
  onUpdate: (id: string, updates: Partial<PioneerJobPost>) => void
}

export default function JobResultTable({ jobs, onUpdate }: Props) {
  async function updateStatus(id: string, status: JobStatus) {
    await fetch(`/api/pioneer-lab/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate(id, { status })
  }

  if (!jobs.length) return null

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] dark:border-white/10">
      <table className="w-full text-xs">
        <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-white/10 sticky top-0">
          <tr>
            {['Company', 'Position', 'Category', 'Location', 'Posted', 'Closing', 'Score', 'Status', 'Source', 'Actions'].map(h => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-[#6B7280] dark:text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/5">
          {jobs.map(j => {
            const score = j.ai_relevance_score
            const scoreColor = score == null ? 'text-[#9CA3AF]'
              : score >= 70 ? 'text-green-600 dark:text-green-400'
              : score >= 40 ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'

            return (
              <tr key={j.id} className="bg-white dark:bg-[#0F172A] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#0F172A] dark:text-white max-w-[120px] truncate">{j.company_name || '—'}</td>
                <td className="px-3 py-2.5 text-[#4B5563] dark:text-slate-300 max-w-[160px]">
                  <p className="truncate">{j.position_title || '—'}</p>
                </td>
                <td className="px-3 py-2.5 text-[#6B7280] dark:text-slate-400 whitespace-nowrap">{j.company_category || '—'}</td>
                <td className="px-3 py-2.5 text-[#6B7280] dark:text-slate-400 whitespace-nowrap">{j.location || '—'}</td>
                <td className="px-3 py-2.5 text-[#6B7280] dark:text-slate-400 whitespace-nowrap">{j.posted_date ?? '—'}</td>
                <td className="px-3 py-2.5 text-[#6B7280] dark:text-slate-400 whitespace-nowrap">{j.closing_date ?? '—'}</td>
                <td className={cn('px-3 py-2.5 font-semibold text-center', scoreColor)}>
                  {score ?? '—'}
                </td>
                <td className="px-3 py-2.5">
                  <select
                    value={j.status}
                    onChange={e => updateStatus(j.id, e.target.value as JobStatus)}
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#38BDF8]/40',
                      STATUS_COLORS[j.status] ?? STATUS_COLORS.new
                    )}
                  >
                    {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-[#6B7280] dark:text-slate-400">{j.source_platform ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    {j.source_link && (
                      <a
                        href={j.source_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
