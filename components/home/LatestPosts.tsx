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

    if (!data) return SAMPLE_POSTS.slice(0, 6)

    return data.map((p: Record<string, unknown>) => ({
      ...p,
      tags: ((p.tags as { tag: unknown }[] | null) || []).map((t: { tag: unknown }) => t.tag),
    })) as Post[]
  } catch {
    return SAMPLE_POSTS.slice(0, 6)
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

// Fallback sample posts for when DB is not configured
const SAMPLE_POSTS: Post[] = [
  {
    id: '1', title: 'Understanding Market Structure in Modern Exchanges',
    slug: 'understanding-market-structure', summary: 'An exploration of how modern equity markets have evolved in structure, fragmentation, and efficiency over the past decade.',
    content: '', thumbnail_url: null, category: 'Markets', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 7,
    view_count: 1240, is_featured: true, is_popular: false,
    published_at: '2025-01-15T00:00:00Z', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z',
    tags: [{ id: 't1', name: 'market-structure', slug: 'market-structure', created_at: '' }],
  },
  {
    id: '2', title: 'Why Market Data Strategy Matters',
    slug: 'why-market-data-strategy-matters', summary: 'Market data has evolved from a utility into a strategic asset. Understanding how to build a coherent data strategy is essential.',
    content: '', thumbnail_url: null, category: 'Data', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 6,
    view_count: 980, is_featured: true, is_popular: true,
    published_at: '2025-01-10T00:00:00Z', created_at: '2025-01-10T00:00:00Z', updated_at: '2025-01-10T00:00:00Z',
    tags: [{ id: 't2', name: 'data-strategy', slug: 'data-strategy', created_at: '' }],
  },
  {
    id: '3', title: 'The Hidden Infrastructure Behind Financial Markets',
    slug: 'hidden-infrastructure-financial-markets', summary: 'The technology and operational layers that keep global financial markets running are largely invisible to most participants.',
    content: '', thumbnail_url: null, category: 'Infrastructure', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 8,
    view_count: 756, is_featured: false, is_popular: true,
    published_at: '2025-01-05T00:00:00Z', created_at: '2025-01-05T00:00:00Z', updated_at: '2025-01-05T00:00:00Z',
    tags: [{ id: 't3', name: 'infrastructure', slug: 'infrastructure', created_at: '' }],
  },
  {
    id: '4', title: 'AI Use Cases in Financial Data Governance',
    slug: 'ai-use-cases-financial-data-governance', summary: 'Artificial intelligence is transforming how financial institutions govern, validate, and distribute market data at scale.',
    content: '', thumbnail_url: null, category: 'AI', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 6,
    view_count: 634, is_featured: false, is_popular: true,
    published_at: '2024-12-28T00:00:00Z', created_at: '2024-12-28T00:00:00Z', updated_at: '2024-12-28T00:00:00Z',
    tags: [{ id: 't4', name: 'ai', slug: 'ai', created_at: '' }],
  },
  {
    id: '5', title: 'Tokenization and the Future of Market Infrastructure',
    slug: 'tokenization-future-market-infrastructure', summary: 'Digital securities and tokenized assets are reshaping how markets function at the infrastructure level.',
    content: '', thumbnail_url: null, category: 'Digital Assets', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 7,
    view_count: 512, is_featured: false, is_popular: false,
    published_at: '2024-12-20T00:00:00Z', created_at: '2024-12-20T00:00:00Z', updated_at: '2024-12-20T00:00:00Z',
    tags: [{ id: 't5', name: 'tokenization', slug: 'tokenization', created_at: '' }],
  },
  {
    id: '6', title: 'Korea\'s Capital Market Evolution',
    slug: 'korea-capital-market-evolution', summary: 'Korea\'s equity markets have undergone significant structural changes, positioning the country as a key player in Asian market data.',
    content: '', thumbnail_url: null, category: 'Markets', language: 'en',
    translation_group_id: null, status: 'published', author_id: '', source_url: null,
    seo_title: null, seo_description: null, og_image_url: null, reading_time: 5,
    view_count: 423, is_featured: false, is_popular: false,
    published_at: '2024-12-15T00:00:00Z', created_at: '2024-12-15T00:00:00Z', updated_at: '2024-12-15T00:00:00Z',
    tags: [{ id: 't6', name: 'korea-market', slug: 'korea-market', created_at: '' }],
  },
]
