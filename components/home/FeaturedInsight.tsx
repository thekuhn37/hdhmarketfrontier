import { getTranslations } from 'next-intl/server'
import PostCard from '@/components/posts/PostCard'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/supabase/types'

interface Props { locale: string }

const SAMPLE_FEATURED: Post = {
  id: '1', title: 'Understanding Market Structure in Modern Exchanges',
  slug: 'understanding-market-structure',
  summary: 'An exploration of how modern equity markets have evolved in structure, fragmentation, and efficiency over the past decade. Market microstructure has undergone fundamental transformation driven by regulation, technology, and competition.',
  content: '', thumbnail_url: null, category: 'Markets', language: 'en',
  translation_group_id: null, status: 'published', author_id: '', source_url: null,
  seo_title: null, seo_description: null, og_image_url: null, reading_time: 7,
  view_count: 1240, is_featured: true, is_popular: false,
  published_at: '2025-01-15T00:00:00Z', created_at: '', updated_at: '',
  tags: [
    { id: 't1', name: 'market-structure', slug: 'market-structure', created_at: '' },
    { id: 't7', name: 'research', slug: 'research', created_at: '' },
  ],
}

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

    if (!data) return SAMPLE_FEATURED
    const raw = data as unknown as Record<string, unknown>
    return {
      ...raw,
      tags: ((raw.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag),
    } as Post
  } catch {
    return SAMPLE_FEATURED
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
