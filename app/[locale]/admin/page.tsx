import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { FileText, Users, MessageSquare, Eye, Mail, TrendingUp } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { formatDate } from '@/lib/utils/format'

interface Props { params: Promise<{ locale: string }> }

async function requireAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/')
  } catch {
    // Supabase not configured - show admin UI in development
    if (process.env.NODE_ENV === 'production') redirect('/login')
  }
}

export default async function AdminDashboard({ params }: Props) {
  const { locale } = await params
  await requireAdmin()
  const t = await getTranslations({ locale, namespace: 'admin' })

  let stats = { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalUsers: 0, totalComments: 0, pendingComments: 0 }
  let recentMessages: { id: string; name: string; subject: string; status: string; created_at: string }[] = []
  let topPosts: { id: string; title: string; view_count: number; category: string }[] = []

  try {
    const supabase = await createClient()
    const [postsRes, usersRes, commentsRes, pendingRes, messagesRes, topPostsRes] = await Promise.all([
      supabase.from('posts').select('status', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('comments').select('id', { count: 'exact' }),
      supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('contact_messages').select('id, name, subject, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('posts').select('id, title, view_count, category').eq('status', 'published').order('view_count', { ascending: false }).limit(5),
    ])

    const allPosts = postsRes.data || []
    stats = {
      totalPosts: postsRes.count || 0,
      publishedPosts: allPosts.filter((p: { status: string }) => p.status === 'published').length,
      draftPosts: allPosts.filter((p: { status: string }) => p.status === 'draft').length,
      totalUsers: usersRes.count || 0,
      totalComments: commentsRes.count || 0,
      pendingComments: pendingRes.count || 0,
    }
    recentMessages = messagesRes.data || []
    topPosts = topPostsRes.data || []
  } catch {}

  const STAT_CARDS = [
    { label: t('totalPosts'), value: stats.totalPosts, icon: FileText, color: 'text-[#0F172A]', bg: 'bg-[#F8FAFC]' },
    { label: t('publishedPosts'), value: stats.publishedPosts, icon: FileText, color: 'text-[#059669]', bg: 'bg-green-50' },
    { label: t('draftPosts'), value: stats.draftPosts, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('totalUsers'), value: stats.totalUsers, icon: Users, color: 'text-[#7C3AED]', bg: 'bg-purple-50' },
    { label: t('totalComments'), value: stats.totalComments, icon: MessageSquare, color: 'text-[#0369A1]', bg: 'bg-blue-50' },
    { label: t('pendingComments'), value: stats.pendingComments, icon: MessageSquare, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-8">{t('dashboard')}</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
              <p className="text-xs text-[#6B7280] mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0F172A] flex items-center gap-2"><Mail size={16} />{t('recentMessages')}</h2>
              <Link href="/admin/contact-messages" className="text-xs text-[#38BDF8] hover:underline">View all</Link>
            </div>
            {recentMessages.length > 0 ? (
              <div className="space-y-3">
                {recentMessages.map(msg => (
                  <div key={msg.id} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{msg.name}</p>
                      <p className="text-xs text-[#6B7280] truncate max-w-[200px]">{msg.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${msg.status === 'unread' ? 'bg-blue-50 text-blue-600' : 'bg-[#F8FAFC] text-[#6B7280]'}`}>
                        {msg.status}
                      </span>
                      <p className="text-xs text-[#6B7280] mt-1">{formatDate(msg.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] text-center py-6">{t('noMessages')}</p>
            )}
          </div>

          {/* Top Posts */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0F172A] flex items-center gap-2"><TrendingUp size={16} />{t('mostViewed')}</h2>
              <Link href="/admin/posts" className="text-xs text-[#38BDF8] hover:underline">View all</Link>
            </div>
            {topPosts.length > 0 ? (
              <div className="space-y-3">
                {topPosts.map((post, i) => (
                  <div key={post.id} className="flex items-center gap-3 py-2 border-b border-[#E5E7EB] last:border-0">
                    <span className="text-[#94A3B8] text-sm font-mono w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{post.title}</p>
                      <span className="text-xs text-[#6B7280]">{post.category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <Eye size={12} /> {post.view_count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#6B7280] text-center py-6">No published posts yet</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <Link href="/admin/posts/new" className="px-6 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all">
            + {t('newPost')}
          </Link>
          <Link href="/admin/posts" className="px-6 py-2.5 rounded-xl border border-[#E5E7EB] text-[#0F172A] text-sm font-semibold hover:bg-[#F8FAFC] transition-all">
            {t('posts')}
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
