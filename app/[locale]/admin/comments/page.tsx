import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminCommentsList from '@/components/admin/AdminCommentsList'
import { createClient } from '@/lib/supabase/server'

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

  let comments: {
    id: string; content: string; status: string; created_at: string
    user_id: string; post_id: string; is_private?: boolean; parent_id?: string | null
  }[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, content, status, created_at, user_id, post_id, is_private, parent_id')
      .order('created_at', { ascending: false })
      .limit(100)
    comments = data || []
  } catch {}

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">{t('comments')}</h1>
          <span className="text-sm text-[#6B7280] dark:text-slate-400">{comments.length} total</span>
        </div>
        <AdminCommentsList initialComments={comments} />
      </div>
    </AdminLayout>
  )
}
