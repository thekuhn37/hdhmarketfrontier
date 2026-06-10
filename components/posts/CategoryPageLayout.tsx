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
      return { posts: [], total: 0 }
    }

    const posts = data.map((p: Record<string, unknown>) => ({
      ...p,
      tags: ((p.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag),
    })) as Post[]

    return { posts, total: count ?? posts.length }
  } catch {
    return { posts: [], total: 0 }
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
    <div className="bg-white dark:bg-[#0B1120]">
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
                <p className="text-[#6B7280] dark:text-slate-400 text-sm">{total} articles</p>
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
              <p className="text-[#6B7280] dark:text-slate-400 text-lg mb-2">No articles yet in this category.</p>
              <p className="text-[#94A3B8] dark:text-slate-500 text-sm">Check back soon for new insights.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
