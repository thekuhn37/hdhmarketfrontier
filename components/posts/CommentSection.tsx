'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/utils/format'
import type { Comment } from '@/lib/supabase/types'

interface Props {
  postId: string
  locale: string
  initialComments: Comment[]
  userId: string | null
  userDisplayName: string | null
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] flex items-center justify-center text-xs font-bold select-none">
      {name[0].toUpperCase()}
    </div>
  )
}

export default function CommentSection({ postId, locale, initialComments, userId, userDisplayName }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  // Top-level form state
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [privateSubmitted, setPrivateSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  // Group into tree
  const topLevel = comments.filter(c => !c.parent_id)
  const repliesMap = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      acc[c.parent_id] = [...(acc[c.parent_id] || []), c]
    }
    return acc
  }, {})

  function makeTempComment(text: string, parentId: string | null = null): Comment {
    return {
      id: `temp-${Date.now()}-${Math.random()}`,
      post_id: postId,
      user_id: userId!,
      content: text,
      status: 'approved',
      is_private: false,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { display_name: userDisplayName } as Comment['user'],
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: content.trim(), is_private: isPrivate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')

      setContent('')
      if (isPrivate) {
        setPrivateSubmitted(true)
      } else {
        // Show immediately — server auto-approved it
        setComments(prev => [...prev, makeTempComment(content.trim())])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim() || submittingReply) return
    setSubmittingReply(true)
    setReplyError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: replyContent.trim(), is_private: false, parent_id: parentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setComments(prev => [...prev, makeTempComment(replyContent.trim(), parentId)])
      setReplyContent('')
      setReplyingTo(null)
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmittingReply(false)
    }
  }

  const totalCount = topLevel.length

  return (
    <section className="mt-16 pt-10 border-t border-[#E5E7EB] dark:border-white/10">
      <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">
        Discussion
        {totalCount > 0 && (
          <span className="text-sm font-normal text-[#9CA3AF] dark:text-slate-500 ml-2">({totalCount})</span>
        )}
      </h2>

      {/* Comment tree */}
      {topLevel.length > 0 ? (
        <div className="space-y-6 mb-10">
          {topLevel.map(comment => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <div className="flex gap-3">
                <Avatar name={comment.user?.display_name ?? 'A'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                      {comment.user?.display_name ?? 'Anonymous'}
                    </span>
                    <span className="text-xs text-[#9CA3AF] dark:text-slate-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                  {userId && (
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                        setReplyContent('')
                        setReplyError(null)
                      }}
                      className="mt-2 text-xs text-[#9CA3AF] dark:text-slate-500 hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors font-medium"
                    >
                      {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                  )}
                </div>
              </div>

              {/* Replies */}
              {(repliesMap[comment.id] || []).length > 0 && (
                <div className="ml-11 mt-4 space-y-4 pl-4 border-l-2 border-[#F1F5F9] dark:border-white/10">
                  {repliesMap[comment.id].map(reply => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar name={reply.user?.display_name ?? 'A'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                            {reply.user?.display_name ?? 'Anonymous'}
                          </span>
                          <span className="text-xs text-[#9CA3AF] dark:text-slate-500">{formatDate(reply.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline reply form */}
              {replyingTo === comment.id && (
                <div className="ml-11 mt-3 pl-4 border-l-2 border-[#38BDF8]/30">
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user?.display_name ?? 'this comment'}…`}
                    rows={3}
                    maxLength={2000}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E2A3B] text-sm text-[#111827] dark:text-slate-200 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/30 focus:border-[#38BDF8] resize-none transition-colors"
                  />
                  {replyError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{replyError}</p>}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={submittingReply || replyContent.trim().length < 1}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-xs font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingReply ? 'Posting…' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#9CA3AF] dark:text-slate-500 mb-8">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}

      {/* Top-level comment form */}
      {userId ? (
        privateSubmitted ? (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-800 dark:text-blue-200">
            Your private message has been sent to the admin. It will not be shown publicly.
            <button
              onClick={() => { setPrivateSubmitted(false); setIsPrivate(false) }}
              className="ml-3 underline text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
            >
              Post another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-[#6B7280] dark:text-slate-400">
              Commenting as <strong className="text-[#0F172A] dark:text-slate-100">{userDisplayName || 'you'}</strong>
            </p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E2A3B] text-sm text-[#111827] dark:text-slate-200 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/30 focus:border-[#38BDF8] resize-none transition-colors"
            />

            {/* Privacy toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => setIsPrivate(p => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 ${
                  isPrivate ? 'bg-[#0F172A] dark:bg-[#38BDF8]' : 'bg-[#D1D5DB] dark:bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-[#6B7280] dark:text-slate-400">
                {isPrivate
                  ? <span className="text-[#0F172A] dark:text-slate-100 font-medium">Private — only visible to the admin</span>
                  : 'Public — visible to everyone'}
              </span>
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF] dark:text-slate-500">{content.length}/2000</span>
              <button
                type="submit"
                disabled={submitting || content.trim().length < 1}
                className="px-5 py-2.5 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-sm font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E2A3B] text-sm text-[#4B5563] dark:text-slate-300">
          Please{' '}
          <a href={`/${locale}/login`} className="text-[#38BDF8] hover:underline font-medium">
            sign in
          </a>{' '}
          to join the discussion.
        </div>
      )}
    </section>
  )
}
