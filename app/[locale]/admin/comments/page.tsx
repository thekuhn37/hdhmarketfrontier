import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'

interface Props { params: Promise<{ locale: string }> }

async function requireAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/')
  } catch { if (process.env.NODE_ENV === 'production') redirect('/login') }
}

export default async function AdminCommentsPage({ params }: Props) {
  const { locale } = await params
  await requireAdmin()
  const t = await getTranslations({ locale, namespace: 'admin' })

  let comments: { id: string; content: string; status: string; created_at: string; user_id: string; post_id: string }[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, content, status, created_at, user_id, post_id')
      .order('created_at', { ascending: false })
      .limit(50)
    comments = data || []
  } catch {}

  const STATUS_COLORS: Record<string, string> = {
    approved: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    hidden: 'bg-[#F8FAFC] text-[#6B7280]',
    deleted: 'bg-red-50 text-red-600',
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-8">{t('comments')}</h1>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {comments.length > 0 ? (
            <div className="divide-y divide-[#E5E7EB]">
              {comments.map(comment => (
                <div key={comment.id} className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111827] line-clamp-2">{comment.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280]">
                      <span>{formatDate(comment.created_at)}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[comment.status] || 'bg-[#F8FAFC] text-[#6B7280]'}`}>
                    {comment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#6B7280]">{t('noCommentsPending')}</div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
