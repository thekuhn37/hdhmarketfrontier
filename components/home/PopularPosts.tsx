import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { TrendingUp } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/supabase/types'

interface Props { locale: string }

async function getPopularPosts(locale: string): Promise<Post[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select(`*, tags:post_tags(tag:tags(*))`)
      .eq('status', 'published')
      .eq('language', locale)
      .order('view_count', { ascending: false })
      .limit(3)

    if (!data || data.length === 0) return []
    return data.map((p: Record<string, unknown>) => ({
      ...p,
      tags: ((p.tags as { tag: unknown }[] | null) || []).map((t: { tag: unknown }) => t.tag),
    })) as Post[]
  } catch {
    return []
  }
}

export default async function PopularPosts({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'home' })
  const posts = await getPopularPosts(locale)

  if (posts.length === 0) return null

  return (
    <section className="py-24 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="content-width">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-[#38BDF8]" />
              <span className="text-sm font-semibold text-[#38BDF8] uppercase tracking-wider">Trending</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-3 tracking-tight">
              {t('popularPosts')}
            </h2>
            <p className="text-[#4B5563] dark:text-slate-400 text-lg">{t('popularPostsDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
