import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { formatDate } from '@/lib/utils/format'
import { Eye, Edit, Plus } from 'lucide-react'

interface Props { params: Promise<{ locale: string }> }

async function requireAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/')
  } catch {
    if (process.env.NODE_ENV === 'production') redirect('/login')
  }
}

export default async function AdminPostsPage({ params }: Props) {
  const { locale } = await params
  await requireAdmin()
  const t = await getTranslations({ locale, namespace: 'admin' })

  let posts: { id: string; title: string; category: string; status: string; language: string; view_count: number; published_at: string | null; is_featured: boolean }[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select('id, title, category, status, language, view_count, published_at, is_featured')
      .order('created_at', { ascending: false })
      .limit(50)
    posts = data || []
  } catch {}

  const STATUS_COLORS: Record<string, string> = {
    published: 'bg-green-50 text-green-700',
    draft: 'bg-amber-50 text-amber-700',
    archived: 'bg-[#F8FAFC] text-[#6B7280]',
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('posts')}</h1>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus size={16} /> {t('newPost')}
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {posts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Title</th>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Category</th>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Status</th>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Lang</th>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Views</th>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Published</th>
                    <th className="text-left p-4 font-semibold text-[#0F172A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, i) => (
                    <tr key={post.id} className={`border-b border-[#E5E7EB] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#F8FAFC]'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#0F172A] line-clamp-1 max-w-xs">{post.title}</span>
                          {post.is_featured && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-600">Featured</span>}
                        </div>
                      </td>
                      <td className="p-4 text-[#4B5563]">{post.category}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[post.status] || 'bg-[#F8FAFC] text-[#6B7280]'}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#6B7280] uppercase text-xs">{post.language}</td>
                      <td className="p-4 text-[#4B5563] flex items-center gap-1">
                        <Eye size={13} /> {post.view_count}
                      </td>
                      <td className="p-4 text-[#6B7280] text-xs">
                        {post.published_at ? formatDate(post.published_at) : '—'}
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/posts/${post.id}`} className="flex items-center gap-1 text-[#0EA5E9] hover:text-[#0F172A] text-sm font-medium transition-colors">
                          <Edit size={13} /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-[#6B7280] mb-4">No posts yet.</p>
              <Link href="/admin/posts/new" className="px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold">
                Create your first post
              </Link>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
