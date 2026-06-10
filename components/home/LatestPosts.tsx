import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/supabase/types'

interface Props { locale: string }

async function getLatestPosts(locale: string): Promise<Post[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select(`*, tags:post_tags(tag:tags(*))`)
      .eq('status', 'published')
      .eq('language', locale)
      .order('published_at', { ascending: false })
      .limit(6)

    if (!data) return []

    return data.map((p: Record<string, unknown>) => ({
      ...p,
      tags: ((p.tags as { tag: unknown }[] | null) || []).map((t: { tag: unknown }) => t.tag),
    })) as Post[]
  } catch {
    return []
  }
}

export default async function LatestPosts({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'home' })
  const posts = await getLatestPosts(locale)

  return (
    <section className="py-24 bg-white dark:bg-[#0B1120]">
      <div className="content-width">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-3 tracking-tight">
              {t('latestPosts')}
            </h2>
            <p className="text-[#4B5563] dark:text-slate-400 text-lg">{t('latestPostsDesc')}</p>
          </div>
          <Link
            href="/markets"
            className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-slate-200 hover:text-[#1E3A5F] dark:hover:text-[#7DD3FC] transition-colors"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-[#6B7280] dark:text-slate-400 text-center py-12">No posts yet. Check back soon.</p>
        )}
      </div>
    </section>
  )
}
