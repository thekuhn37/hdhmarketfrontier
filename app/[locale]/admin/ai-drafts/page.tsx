import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { formatDate } from '@/lib/utils/format'
import { BrainCircuit, Plus } from 'lucide-react'

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

export default async function AdminAIDraftsPage({ params }: Props) {
  const { locale } = await params
  await requireAdmin()
  const t = await getTranslations({ locale, namespace: 'admin' })

  let drafts: { id: string; title: string; source_type: string; status: string; created_at: string; generated_summary: string | null }[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('ai_drafts')
      .select('id, title, source_type, status, created_at, generated_summary')
      .order('created_at', { ascending: false })
      .limit(20)
    drafts = data || []
  } catch {}

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">{t('aiDrafts')}</h1>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1">AI-generated draft posts awaiting review</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all">
            <Plus size={15} /> Generate Draft
          </button>
        </div>

        {/* Architecture note */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <BrainCircuit size={20} className="text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200">AI Draft Architecture Ready</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                Connect <code className="bg-blue-100 dark:bg-blue-500/20 px-1 rounded">OPENAI_API_KEY</code> in your environment to enable AI-powered draft generation.
                The system supports market briefs from Yahoo Finance data, news analysis, and topic research.
                All AI-generated content is saved as draft for admin review before publishing.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">See <code>/lib/ai/summary.ts</code> for implementation details.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {drafts.length > 0 ? (
            drafts.map(draft => (
              <div key={draft.id} className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0F172A] dark:text-white truncate">{draft.title}</h3>
                    {draft.generated_summary && <p className="text-sm text-[#4B5563] dark:text-slate-300 mt-1 line-clamp-2">{draft.generated_summary}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280] dark:text-slate-400">
                      <span className="capitalize">{draft.source_type.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{formatDate(draft.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${draft.status === 'draft' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'}`}>
                      {draft.status}
                    </span>
                    <Link href="/admin/posts/new" className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/15 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                      Edit → Post
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 py-16 text-center">
              <BrainCircuit size={40} className="text-[#E5E7EB] dark:text-white/20 mx-auto mb-3" />
              <p className="text-[#6B7280] dark:text-slate-400">No AI drafts yet. Generate your first draft to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
