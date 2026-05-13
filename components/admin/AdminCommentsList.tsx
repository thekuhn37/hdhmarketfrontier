'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/utils/format'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AdminComment {
  id: string
  content: string
  status: string
  created_at: string
  user_id: string
  post_id: string
  is_private?: boolean
  parent_id?: string | null
}

interface Props {
  initialComments: AdminComment[]
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30',
  pending:  'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  hidden:   'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB] dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  deleted:  'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
}

export default function AdminCommentsList({ initialComments }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    setUpdateError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 text-center py-16 text-[#6B7280] dark:text-slate-400">
        No comments yet
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
      {updateError && (
        <div className="px-5 py-3 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-300">{updateError}</div>
      )}
      <div className="divide-y divide-[#E5E7EB] dark:divide-white/10">
        {comments.map(comment => {
          const isExpanded = expandedId === comment.id
          const isUpdating = updating === comment.id

          return (
            <div key={comment.id} className="p-5">
              {/* Clickable summary row */}
              <button
                className="w-full text-left flex items-start gap-4"
                onClick={() => setExpandedId(isExpanded ? null : comment.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#111827] dark:text-slate-100 line-clamp-2 text-left">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-[#9CA3AF] dark:text-slate-500">{formatDate(comment.created_at)}</span>
                    {comment.is_private && (
                      <span className="px-2 py-0.5 rounded-full bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-[10px] font-semibold tracking-wide">
                        PRIVATE
                      </span>
                    )}
                    {comment.parent_id && (
                      <span className="text-[10px] text-[#9CA3AF] dark:text-slate-500 font-medium uppercase tracking-wide">↩ Reply</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[comment.status] ?? STATUS_COLORS.hidden}`}>
                    {comment.status}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-[#9CA3AF] dark:text-slate-500" /> : <ChevronDown size={14} className="text-[#9CA3AF] dark:text-slate-500" />}
                </div>
              </button>

              {/* Expanded detail + action buttons */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#F1F5F9] dark:border-white/10">
                  <p className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-5">
                    {comment.content}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {comment.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'approved')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isUpdating ? '…' : 'Approve'}
                      </button>
                    )}
                    {comment.status === 'approved' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'hidden')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[#4B5563] dark:text-slate-300 text-xs font-semibold hover:bg-[#F1F5F9] dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                      >
                        {isUpdating ? '…' : 'Hide'}
                      </button>
                    )}
                    {comment.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'hidden')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[#4B5563] dark:text-slate-300 text-xs font-semibold hover:bg-[#F1F5F9] dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                      >
                        {isUpdating ? '…' : 'Hide'}
                      </button>
                    )}
                    {comment.status === 'hidden' && (
                      <>
                        <button
                          onClick={() => updateStatus(comment.id, 'approved')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => updateStatus(comment.id, 'pending')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? '…' : 'Set Pending'}
                        </button>
                      </>
                    )}
                    {comment.status !== 'deleted' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'deleted')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {isUpdating ? '…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
