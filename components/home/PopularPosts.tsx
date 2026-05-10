import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { TrendingUp } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/supabase/types'

interface Props { locale: string }

const SAMPLE_POPULAR: Post[] = [
  {
    id: '2', title: 'Why Market Data Strategy Matters',
    slug: 'why-market-data-strategy-matters', summary: 'Market data has evolved from a utility into a strategic asset.',
    content: '', thumbnail_url: null, category: 'Data', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 6,
    view_count: 980, is_featured: true, is_popular: true,
    published_at: '2025-01-10T00:00:00Z', created_at: '', updated_at: '',
    tags: [{ id: 't2', name: 'data-strategy', slug: 'data-strategy', created_at: '' }],
  },
  {
    id: '3', title: 'The Hidden Infrastructure Behind Financial Markets',
    slug: 'hidden-infrastructure-financial-markets', summary: 'The technology layers that keep global financial markets running.',
    content: '', thumbnail_url: null, category: 'Infrastructure', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 8,
    view_count: 756, is_featured: false, is_popular: true,
    published_at: '2025-01-05T00:00:00Z', created_at: '', updated_at: '',
    tags: [{ id: 't3', name: 'infrastructure', slug: 'infrastructure', created_at: '' }],
  },
  {
    id: '4', title: 'AI Use Cases in Financial Data Governance',
    slug: 'ai-use-cases-financial-data-governance', summary: 'AI is transforming how financial institutions govern and distribute market data.',
    content: '', thumbnail_url: null, category: 'AI', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 6,
    view_count: 634, is_featured: false, is_popular: true,
    published_at: '2024-12-28T00:00:00Z', created_at: '', updated_at: '',
    tags: [{ id: 't4', name: 'ai', slug: 'ai', created_at: '' }],
  },
]

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

    if (!data || data.length === 0) return SAMPLE_POPULAR
    return data.map((p: Record<string, unknown>) => ({
      ...p,
      tags: ((p.tags as { tag: unknown }[] | null) || []).map((t: { tag: unknown }) => t.tag),
    })) as Post[]
  } catch {
    return SAMPLE_POPULAR
  }
}

export default async function PopularPosts({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'home' })
  const posts = await getPopularPosts(locale)

  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="content-width">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-[#38BDF8]" />
              <span className="text-sm font-semibold text-[#38BDF8] uppercase tracking-wider">Trending</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-3 tracking-tight">
              {t('popularPosts')}
            </h2>
            <p className="text-[#4B5563] text-lg">{t('popularPostsDesc')}</p>
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
