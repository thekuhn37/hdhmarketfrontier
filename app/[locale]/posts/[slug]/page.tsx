import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import { Calendar, Clock, Eye, ArrowLeft, Share2, AlertCircle, Languages } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import { translatePost } from '@/lib/ai/translate'
import type { Post, Comment } from '@/lib/supabase/types'
import CommentSection from '@/components/posts/CommentSection'
import ReadingProgress from '@/components/posts/ReadingProgress'
import ResearchCoveragePeriod from '@/components/posts/ResearchCoveragePeriod'

const LOCALE_NAMES: Record<string, string> = { en: 'English', ko: 'Korean', zh: 'Chinese' }

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let post: Post | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('posts').select('title, summary, og_image_url, seo_title, seo_description').eq('slug', slug).single()
    post = data as unknown as Post
  } catch {}
  if (!post) return { title: 'Post Not Found' }
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.summary || '',
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.summary || '',
      images: post.og_image_url ? [post.og_image_url] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'posts' })

  let post: Post | null = null
  let relatedPosts: Post[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select('*, tags:post_tags(tag:tags(*))')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    if (data) {
      const raw = data as unknown as Record<string, unknown>
      post = { ...raw, tags: ((raw.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag) } as Post
      await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', post.id)
      const { data: related } = await supabase
        .from('posts')
        .select('*, tags:post_tags(tag:tags(*))')
        .eq('status', 'published')
        .eq('category', post.category)
        .neq('id', post.id)
        .limit(3)
      if (related) {
        relatedPosts = related.map((p: Record<string, unknown>) => ({
          ...p,
          tags: ((p.tags as { tag: unknown }[]) || []).map((t: { tag: unknown }) => t.tag),
        })) as Post[]
      }
    }
  } catch {}

  if (!post) {
    notFound()
  }

  // Display values — start with originals, then overlay translation if needed
  let displayTitle = post.title
  let displaySummary = post.summary
  let displayContent = post.content
  let isAITranslated = false
  const needsTranslation = post.language !== locale

  if (needsTranslation && post.id) {
    try {
      const supabase = await createClient()

      // 1. Check translation cache
      const { data: cached, error: cacheReadErr } = await supabase
        .from('post_translations')
        .select('title, summary, content')
        .eq('post_id', post.id)
        .eq('locale', locale)
        .single() as unknown as { data: { title: string; summary: string | null; content: string } | null; error: unknown }

      if (cached) {
        displayTitle = cached.title
        displaySummary = cached.summary || post.summary
        displayContent = cached.content
        isAITranslated = true
      } else if (process.env.OPENAI_API_KEY) {
        // 2. Generate translation and cache it
        const result = await translatePost(
          { title: post.title, summary: post.summary, content: post.content },
          locale
        )
        if (result.isAI) {
          // Update display first — show translation even if cache write fails
          displayTitle = result.title
          displaySummary = result.summary
          displayContent = result.content
          isAITranslated = true
          // Persist to cache (best-effort)
          try {
            const admin = createAdminClient()
            const { error: upsertErr } = await admin.from('post_translations').upsert(
              { post_id: post.id, locale, title: result.title, summary: result.summary, content: result.content },
              { onConflict: 'post_id,locale' }
            )
          } catch {
            // best-effort cache write — ignore failures
          }
        }
      }
      // 3. If no AI key and no cache: fall through — show original with notice below
    } catch {
      // translation failed — display original content
    }
  }

  const originalLangName = LOCALE_NAMES[post.language] ?? post.language

  // Compute Mon–Fri coverage window from the post date (UTC)
  const coveragePeriod: { start: string; end: string } | null = (() => {
    const raw = post.published_at || post.created_at
    if (!raw) return null
    const d = new Date(raw)
    const dow = d.getUTCDay() // 0=Sun … 6=Sat
    const toMonday = dow === 0 ? -6 : 1 - dow
    const toFriday = dow === 6 ? -1 : 5 - dow
    const mon = new Date(d); mon.setUTCDate(d.getUTCDate() + toMonday)
    const fri = new Date(d); fri.setUTCDate(d.getUTCDate() + toFriday)
    return { start: mon.toISOString().slice(0, 10), end: fri.toISOString().slice(0, 10) }
  })()

  // Fetch approved comments + current user in parallel
  let currentUserId: string | null = null
  let currentUserDisplayName: string | null = null
  let approvedComments: Comment[] = []

  try {
    const supabase = await createClient()
    const [{ data: { user } }, { data: commentData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('comments')
        .select('*, user:profiles(display_name, avatar_url)')
        .eq('post_id', post.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true }),
    ])
    if (user) {
      currentUserId = user.id
      const { data: profile } = await supabase
        .from('profiles').select('display_name').eq('id', user.id).single()
      currentUserDisplayName = profile?.display_name ?? null
    }
    approvedComments = (commentData || []) as unknown as Comment[]
  } catch {}

  return (
    <div className="bg-white dark:bg-[#0B1120]">
      <ReadingProgress />
      {/* Back */}
      <div className="border-b border-[#E5E7EB] dark:border-white/10">
        <div className="content-width py-4">
          <Link
            href={`/${post.category.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> {t('backToCategory')} {post.category}
          </Link>
        </div>
      </div>

      <article className="py-16">
        <div className="article-width">
          {/* Translation notice */}
          {needsTranslation && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl mb-8 text-sm ${
              isAITranslated
                ? 'bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20'
                : 'bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
            }`}>
              <Languages size={16} className={`flex-shrink-0 mt-0.5 ${isAITranslated ? 'text-blue-500 dark:text-blue-300' : 'text-amber-500 dark:text-amber-300'}`} />
              <div>
                {isAITranslated ? (
                  <p className="text-blue-800 dark:text-blue-200">
                    Automatically translated from {originalLangName} by AI. Terminology may vary — view the{' '}
                    <Link href={`/posts/${slug}`} locale={post.language as 'en' | 'ko' | 'zh'} className="underline font-medium">
                      original {originalLangName} version
                    </Link>.
                  </p>
                ) : (
                  <p className="text-amber-800 dark:text-amber-200">
                    This post was written in {originalLangName}. Automatic translation requires{' '}
                    <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded text-xs">OPENAI_API_KEY</code> to be configured.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Research Coverage Period — shown for Markets weekly briefings */}
          {post.category === 'Markets' && coveragePeriod && (
            <ResearchCoveragePeriod start={coveragePeriod.start} end={coveragePeriod.end} />
          )}

          {/* Category */}
          <span className="inline-block px-3 py-1 rounded-full bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-xs font-semibold mb-6 capitalize">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] dark:text-white leading-tight mb-6 tracking-tight">
            {displayTitle}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280] dark:text-slate-400 mb-6 pb-6 border-b border-[#E5E7EB] dark:border-white/10">
            <span className="font-medium text-[#0F172A] dark:text-slate-200">{t('by')} Harry D. Hwang</span>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {formatDate(post.published_at)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {t('readingTime', { minutes: post.reading_time })}
            </span>
            {post.view_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye size={14} /> {t('views', { count: post.view_count })}
              </span>
            )}
            {isAITranslated && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-medium">
                <Languages size={12} /> AI Translated
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span key={tag.id} className="px-3 py-1 rounded-full text-xs bg-[#F8FAFC] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[#4B5563] dark:text-slate-300">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Thumbnail */}
          {post.thumbnail_url && (
            <div className="rounded-2xl overflow-hidden mb-10 aspect-video">
              <img src={post.thumbnail_url} alt={displayTitle} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Summary */}
          {displaySummary && (
            <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10 mb-8">
              <p className="text-[#4B5563] dark:text-slate-300 text-lg leading-relaxed italic">{displaySummary}</p>
            </div>
          )}

          {/* Content */}
          <div
            className="article-body text-[#111827] dark:text-slate-300 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayContent || '<p>Content coming soon.</p>' }}
          />

          {/* Share */}
          <div className="flex items-center gap-3 mt-12 pt-8 border-t border-[#E5E7EB] dark:border-white/10">
            <span className="text-sm font-medium text-[#4B5563] dark:text-slate-400 flex items-center gap-2">
              <Share2 size={16} /> Share:
            </span>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(displayTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              LinkedIn
            </a>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex gap-3">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{t('disclaimer')}</p>
          </div>

          {/* Comments — only for real DB posts (UUIDs), not sample fallback posts */}
          {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post.id) && (
            <CommentSection
              postId={post.id}
              locale={locale}
              initialComments={approvedComments}
              userId={currentUserId}
              userDisplayName={currentUserDisplayName}
            />
          )}
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-[#F8FAFC] dark:bg-[#0F172A]">
          <div className="content-width">
            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-8">{t('relatedPosts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rp => (
                <Link key={rp.id} href={`/posts/${rp.slug}`} className="group block p-6 rounded-2xl bg-white dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/40 dark:hover:border-[#38BDF8]/50 hover:shadow-md transition-all">
                  <span className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">{rp.category}</span>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-100 mt-2 leading-snug group-hover:text-[#1E3A5F] dark:group-hover:text-[#7DD3FC] transition-colors line-clamp-2">{rp.title}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-2 line-clamp-2">{rp.summary}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-[#6B7280] dark:text-slate-500">
                    <Clock size={12} /> {t('readingTime', { minutes: rp.reading_time })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
