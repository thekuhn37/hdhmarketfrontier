import { createClient } from '@/lib/supabase/server'
import PostCard from './PostCard'
import Pagination from './Pagination'
import type { Post } from '@/lib/supabase/types'
import type { ReactNode } from 'react'

const PAGE_SIZE = 12

interface Props {
  category: string
  title: string
  description: string
  locale: string
  icon?: ReactNode
  accentColor?: string
  page?: number
}

const FALLBACK: Post[] = [
  { id:'1', title:'Understanding Market Structure in Modern Exchanges', slug:'understanding-market-structure', summary:'An exploration of how modern equity markets have evolved in structure, fragmentation, and efficiency over the past decade.', content:'', thumbnail_url:null, category:'Markets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:7, view_count:1240, is_featured:true, is_popular:false, published_at:'2025-01-15T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'2', title:'Why Market Data Strategy Matters', slug:'why-market-data-strategy-matters', summary:'Market data has evolved from a utility into a strategic asset requiring careful governance and distribution strategy.', content:'', thumbnail_url:null, category:'Data', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:6, view_count:980, is_featured:true, is_popular:true, published_at:'2025-01-10T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'3', title:'The Hidden Infrastructure Behind Financial Markets', slug:'hidden-infrastructure-financial-markets', summary:'The technology and operational layers that keep global financial markets running are largely invisible to most participants.', content:'', thumbnail_url:null, category:'Infrastructure', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:8, view_count:756, is_featured:false, is_popular:true, published_at:'2025-01-05T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'4', title:'AI Use Cases in Financial Data Governance', slug:'ai-use-cases-financial-data-governance', summary:'AI is transforming how financial institutions govern, validate, and distribute market data at scale.', content:'', thumbnail_url:null, category:'AI', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:6, view_count:634, is_featured:false, is_popular:true, published_at:'2024-12-28T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'5', title:'Tokenization and the Future of Market Infrastructure', slug:'tokenization-future-market-infrastructure', summary:'Digital securities and tokenized assets are reshaping how markets function at the infrastructure level.', content:'', thumbnail_url:null, category:'Digital Assets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:7, view_count:512, is_featured:false, is_popular:false, published_at:'2024-12-20T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'6', title:"Korea's Capital Market Evolution", slug:'korea-capital-market-evolution', summary:"Korea's equity markets have undergone significant structural changes, positioning the country as a key player in Asian market data.", content:'', thumbnail_url:null, category:'Markets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:5, view_count:423, is_featured:false, is_popular:false, published_at:'2024-12-15T00:00:00Z', created_at:'', updated_at:'', tags:[] },
]

async function getPosts(
  category: string,
  locale: string,
  page: number,
): Promise<{ posts: Post[]; total: number }> {
  try {
    const supabase = await createClient()
    const offset = (page - 1) * PAGE_SIZE

    const { data, count } = await supabase
      .from('posts')
      .select('*, tags:post_tags(tag:tags(*))', { count: 'exact' })
      .eq('status', 'published')
      .eq('language', locale)
      .ilike('category', category)
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (!data || data.length === 0) {
      const fallback = FALLBACK.filter(p => p.category.toLowerCase() === category.toLowerCase())
      return { posts: fallback, total: fallback.length }
    }

    const posts = data.map((p: Record<string, unknown>) => ({
      ...p,
      tags: ((p.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag),
    })) as Post[]

    return { posts, total: count ?? posts.length }
  } catch {
    const fallback = FALLBACK.filter(p => p.category.toLowerCase() === category.toLowerCase())
    return { posts: fallback, total: fallback.length }
  }
}

export default async function CategoryPageLayout({
  category,
  title,
  description,
  locale,
  accentColor = '#0F172A',
  page = 1,
}: Props) {
  const { posts, total } = await getPosts(category, locale, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-')
  const basePath = `/${locale}/${categorySlug}`

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="gradient-navy py-20">
        <div className="content-width">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{title}</h1>
          <p className="text-white/70 text-lg max-w-2xl">{description}</p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-20">
        <div className="content-width">
          {posts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-[#6B7280] text-sm">{total} articles</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
            </>
          ) : (
            <div className="text-center py-24">
              <p className="text-[#6B7280] text-lg mb-2">No articles yet in this category.</p>
              <p className="text-[#94A3B8] text-sm">Check back soon for new insights.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
