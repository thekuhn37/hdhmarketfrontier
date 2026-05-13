'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import PostCard from '@/components/posts/PostCard'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

const CATEGORIES = ['Markets', 'Data', 'Infrastructure', 'AI', 'Digital Assets']
const SORTS = ['Latest', 'Popular', 'Relevance']

const FALLBACK: Post[] = [
  { id:'1', title:'Understanding Market Structure in Modern Exchanges', slug:'understanding-market-structure', summary:'How modern equity markets have evolved in structure and efficiency.', content:'', thumbnail_url:null, category:'Markets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:7, view_count:1240, is_featured:true, is_popular:false, published_at:'2025-01-15T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'2', title:'Why Market Data Strategy Matters', slug:'why-market-data-strategy-matters', summary:'Market data as strategic asset requiring careful governance.', content:'', thumbnail_url:null, category:'Data', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:6, view_count:980, is_featured:true, is_popular:true, published_at:'2025-01-10T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'3', title:'The Hidden Infrastructure Behind Financial Markets', slug:'hidden-infrastructure-financial-markets', summary:'Technology layers that keep global financial markets running.', content:'', thumbnail_url:null, category:'Infrastructure', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:8, view_count:756, is_featured:false, is_popular:true, published_at:'2025-01-05T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'4', title:'AI Use Cases in Financial Data Governance', slug:'ai-use-cases-financial-data-governance', summary:'AI transforming how financial institutions govern market data.', content:'', thumbnail_url:null, category:'AI', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:6, view_count:634, is_featured:false, is_popular:true, published_at:'2024-12-28T00:00:00Z', created_at:'', updated_at:'', tags:[] },
  { id:'5', title:'Tokenization and the Future of Market Infrastructure', slug:'tokenization-future-market-infrastructure', summary:'Digital securities and tokenized assets reshaping markets.', content:'', thumbnail_url:null, category:'Digital Assets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:7, view_count:512, is_featured:false, is_popular:false, published_at:'2024-12-20T00:00:00Z', created_at:'', updated_at:'', tags:[] },
]

interface Props {
  initialQuery: string
  initialCategory: string
}

export default function SearchClient({ initialQuery, initialCategory }: Props) {
  const t = useTranslations('search')
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState('Latest')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (q: string, cat: string, sortBy: string) => {
    setLoading(true)
    setSearched(true)

    // Update URL params
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('category', cat)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    try {
      const supabase = createClient()
      let qb = supabase
        .from('posts')
        .select('*, tags:post_tags(tag:tags(*))')
        .eq('status', 'published')

      if (q.trim()) {
        qb = qb.or(`title.ilike.%${q}%,summary.ilike.%${q}%,content.ilike.%${q}%`)
      }
      if (cat) {
        qb = qb.ilike('category', cat)
      }
      if (sortBy === 'Popular') {
        qb = qb.order('view_count', { ascending: false })
      } else {
        qb = qb.order('published_at', { ascending: false })
      }

      const { data } = await qb.limit(20)
      if (data && data.length > 0) {
        setResults(data.map((p: Record<string, unknown>) => ({
          ...p,
          tags: ((p.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag),
        })) as Post[])
      } else if (!data || data.length === 0) {
        // Fallback filter
        let filtered = [...FALLBACK]
        if (q.trim()) filtered = filtered.filter(p => p.title.toLowerCase().includes(q.toLowerCase()) || (p.summary || '').toLowerCase().includes(q.toLowerCase()))
        if (cat) filtered = filtered.filter(p => p.category.toLowerCase() === cat.toLowerCase())
        setResults(filtered)
      }
    } catch {
      let filtered = [...FALLBACK]
      if (q.trim()) filtered = filtered.filter(p => p.title.toLowerCase().includes(q.toLowerCase()) || (p.summary || '').toLowerCase().includes(q.toLowerCase()))
      if (cat) filtered = filtered.filter(p => p.category.toLowerCase() === cat.toLowerCase())
      setResults(filtered)
    }
    setLoading(false)
  }, [pathname, router])

  useEffect(() => {
    if (initialQuery || initialCategory) {
      doSearch(initialQuery, initialCategory, sort)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query, category, sort)
  }

  return (
    <div>
      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative mb-4">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#E5E7EB] dark:border-white/15 bg-white dark:bg-[#1E2A3B] text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', !category ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8] dark:text-[#0B1120]' : 'bg-[#F8FAFC] border border-[#E5E7EB] text-[#4B5563] hover:bg-white dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10')}
            >
              {t('allCategories')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', category === cat ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8] dark:text-[#0B1120]' : 'bg-[#F8FAFC] border border-[#E5E7EB] text-[#4B5563] hover:bg-white dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10')}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-8 py-3 rounded-xl gradient-navy text-white font-semibold text-sm hover:opacity-90 transition-all"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-[#6B7280] dark:text-slate-400">Searching...</div>
      ) : searched ? (
        <>
          {results.length > 0 ? (
            <>
              <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-6">
                {t('results', { count: results.length })}
                {category ? ` in ${category}` : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <p className="text-[#6B7280] dark:text-slate-400 text-lg mb-2">{t('noResults')}</p>
              <p className="text-[#94A3B8] dark:text-slate-500 text-sm">{t('noResultsDesc')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-[#6B7280] dark:text-slate-400">
          Enter a search term to find articles
        </div>
      )}
    </div>
  )
}
