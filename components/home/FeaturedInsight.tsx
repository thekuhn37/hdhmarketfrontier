import { getTranslations } from 'next-intl/server'
import PostCard from '@/components/posts/PostCard'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/supabase/types'

interface Props { locale: string }

async function getFeaturedPost(): Promise<Post | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select(`*, tags:post_tags(tag:tags(*))`)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return null
    const raw = data as unknown as Record<string, unknown>
    return {
      ...raw,
      tags: ((raw.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag),
    } as Post
  } catch {
    return null
  }
}

export default async function FeaturedInsight({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'home' })
  const post = await getFeaturedPost()

  if (!post) return null

  return (
    <section className="py-24 bg-white dark:bg-[#0B1120]">
      <div className="content-width">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-slate-200 uppercase tracking-wider mb-3">
            <span className="w-6 h-0.5 bg-[#38BDF8]" />
            {t('featuredInsight')}
          </span>
        </div>
        <PostCard post={post} variant="featured" />
      </div>
    </section>
  )
}
