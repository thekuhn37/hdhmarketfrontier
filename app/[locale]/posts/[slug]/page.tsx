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

const LOCALE_NAMES: Record<string, string> = { en: 'English', ko: 'Korean', zh: 'Chinese' }

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// Sample post content for fallback
const SAMPLE_CONTENT: Record<string, string> = {
  'understanding-market-structure': `
<h2>The Evolution of Market Microstructure</h2>
<p>Modern equity markets have undergone a fundamental transformation over the past two decades. The rise of electronic trading, regulatory reforms, and advances in technology have collectively reshaped how markets operate, how liquidity is formed, and how participants interact with exchanges.</p>
<p>The fragmentation of equity markets, particularly in the United States and Europe following MiFID II and Reg NMS, has created a complex multi-venue landscape. While competition among venues has reduced explicit trading costs, it has also introduced new challenges around best execution, data fragmentation, and market data costs.</p>
<h2>Key Structural Dynamics</h2>
<p>Several forces continue to reshape market structure globally. High-frequency trading has become embedded in liquidity provision, dark pools serve institutional needs for minimizing market impact, and the rise of retail participation through zero-commission platforms has altered order flow dynamics significantly.</p>
<p>From a data perspective, the complexity of modern market structure has made market data itself a critical infrastructure asset. Understanding consolidated tape economics, the value of proprietary data feeds, and the cost of market data has become essential for any serious financial market participant.</p>
<h2>Global Implications</h2>
<p>Asian markets, including Korea's KOSPI and KOSDAQ, have their own structural characteristics shaped by unique regulatory environments, ownership structures, and technology adoption patterns. Understanding these local dynamics is essential for global participants seeking to operate effectively across multiple jurisdictions.</p>
<p>As markets continue to evolve with the integration of digital assets and potential tokenization of traditional securities, the structural foundations being built today will have long-lasting implications for how capital markets function in the future.</p>
  `,
  'why-market-data-strategy-matters': `
<h2>Market Data as Strategic Asset</h2>
<p>For decades, market data was treated primarily as a utility — a necessary cost of doing business in financial markets. Today, the paradigm has shifted fundamentally. Market data has become a strategic asset that can define competitive advantage, drive new revenue streams, and enable entirely new business models.</p>
<p>Exchanges, data vendors, and financial institutions that recognize this shift and invest in coherent data strategies are positioning themselves for long-term relevance. Those that continue to treat data as merely an operational input are falling behind.</p>
<h2>Components of a Market Data Strategy</h2>
<p>A robust market data strategy encompasses several interconnected elements: data governance frameworks that ensure quality and consistency, distribution infrastructure that enables efficient delivery across channels, licensing models that align commercial objectives with market needs, and analytics capabilities that transform raw data into actionable intelligence.</p>
<p>The rise of alternative data — from satellite imagery to social sentiment — has expanded the scope of what constitutes relevant market data. Financial firms that can integrate traditional and alternative data sources into coherent analytical frameworks gain significant informational advantages.</p>
<h2>The Regulatory Dimension</h2>
<p>Regulators globally are paying increasing attention to market data pricing and access. The European Union's consolidated tape initiative, debates around data fees in the United States, and similar discussions in Asian markets reflect growing concerns about fair access to market data infrastructure.</p>
<p>Navigating this regulatory landscape while building sustainable commercial models requires strategic sophistication. The most successful market data businesses will be those that build genuine value for customers while operating with transparency and regulatory alignment.</p>
  `,
  'hidden-infrastructure-financial-markets': `
<h2>The Invisible Foundation</h2>
<p>When investors execute a trade, they rarely consider the extraordinary complexity of the infrastructure that enables that transaction. From the moment an order is submitted to final settlement, dozens of interconnected systems, protocols, and institutions work in concert to ensure the seamless transfer of securities and funds.</p>
<p>This infrastructure — exchanges, central counterparty clearinghouses (CCPs), central securities depositories (CSDs), messaging networks, and market data distribution systems — forms the invisible foundation upon which global capital markets operate.</p>
<h2>Critical Infrastructure Components</h2>
<p>Central counterparty clearing has become one of the most significant risk management innovations in modern financial history. By interposing between buyer and seller, CCPs fundamentally transform bilateral counterparty risk into centralized and managed risk. However, this concentration also creates systemic importance that requires careful oversight.</p>
<p>Market connectivity infrastructure — whether through direct market access, co-location services, or network providers like Fixnetix or TNS — has become a competitive battleground. Latency measured in microseconds can determine commercial viability for certain trading strategies.</p>
<h2>The Data Infrastructure Layer</h2>
<p>Underlying all of this is a sophisticated market data infrastructure that captures, normalizes, distributes, and stores enormous volumes of market information. Real-time data feeds, historical data archives, analytics platforms, and derived data products form an ecosystem with its own complex economics and competitive dynamics.</p>
<p>Understanding this infrastructure layer is increasingly important for anyone seeking to operate effectively in modern financial markets, whether as a participant, technology provider, regulator, or researcher.</p>
  `,
  'ai-use-cases-financial-data-governance': `
<h2>AI Transforms Data Operations</h2>
<p>Artificial intelligence and machine learning are reshaping financial data operations in ways that were unimaginable a decade ago. From automated data quality validation to intelligent routing of market data queries, AI capabilities are being embedded throughout the financial data lifecycle.</p>
<p>The sheer volume and velocity of financial market data make AI-assisted approaches not just beneficial but increasingly necessary. A major exchange can generate billions of data records per trading day — a scale that requires intelligent automation to manage effectively.</p>
<h2>Key AI Applications</h2>
<p>In data governance, machine learning models are being deployed to automatically detect anomalies in market data streams, flag potential quality issues before they propagate through downstream systems, and classify data according to governance frameworks with significantly higher accuracy than rule-based systems.</p>
<p>Natural language processing is enabling new approaches to unstructured financial data — earnings calls, regulatory filings, news feeds, and research reports can be analyzed at scale to extract structured signals that complement traditional quantitative data.</p>
<h2>Challenges and Considerations</h2>
<p>The adoption of AI in financial data governance is not without challenges. Model explainability is particularly critical in regulated environments where decisions must be auditable. Data lineage requirements mean that AI-enhanced data must still maintain clear provenance documentation.</p>
<p>As AI capabilities continue to advance, the financial data industry will need to develop new standards, frameworks, and best practices to ensure that AI-enhanced data governance remains reliable, auditable, and aligned with evolving regulatory expectations.</p>
  `,
  'tokenization-future-market-infrastructure': `
<h2>The Tokenization Revolution</h2>
<p>The tokenization of real-world assets represents one of the most significant structural innovations in financial markets in decades. By representing ownership claims on traditional assets — equities, bonds, real estate, commodities — as digital tokens on distributed ledgers, tokenization has the potential to fundamentally reshape market infrastructure.</p>
<p>Major financial institutions including BlackRock, JPMorgan, and numerous global exchanges are actively developing tokenized asset capabilities. This is no longer an experimental fringe technology but an emerging institutional infrastructure with real capital being deployed.</p>
<h2>Infrastructure Implications</h2>
<p>The shift toward tokenized assets creates significant implications for existing market infrastructure. Traditional clearing and settlement processes, which can take T+2 or longer, could be compressed to near-instantaneous settlement through smart contract automation. This has profound implications for collateral efficiency and counterparty risk management.</p>
<p>Market data infrastructure will also need to evolve. Tokenized assets may trade across multiple chains, protocols, and venues simultaneously, creating new challenges around consolidated pricing, reference data, and regulatory reporting.</p>
<h2>The Road Ahead</h2>
<p>Despite the promise, significant challenges remain. Regulatory frameworks for tokenized securities vary significantly across jurisdictions. Interoperability between different blockchain networks and between blockchain-based and traditional infrastructure requires significant technical and standards development work.</p>
<p>The financial institutions and infrastructure providers that develop deep expertise in tokenized asset markets now will be well-positioned as institutional adoption accelerates in the coming years. The intersection of traditional market infrastructure experience with emerging technology capability will be a key competitive differentiator.</p>
  `,
}

const SAMPLE_POSTS: Post[] = [
  { id:'1', title:'Understanding Market Structure in Modern Exchanges', slug:'understanding-market-structure', summary:'An exploration of how modern equity markets have evolved in structure, fragmentation, and efficiency.', content: SAMPLE_CONTENT['understanding-market-structure'] || '', thumbnail_url:null, category:'Markets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:7, view_count:1240, is_featured:true, is_popular:false, published_at:'2025-01-15T00:00:00Z', created_at:'', updated_at:'', tags:[{ id:'t1', name:'market-structure', slug:'market-structure', created_at:'' }, { id:'t7', name:'research', slug:'research', created_at:'' }] },
  { id:'2', title:'Why Market Data Strategy Matters', slug:'why-market-data-strategy-matters', summary:'Market data has evolved from a utility into a strategic asset.', content: SAMPLE_CONTENT['why-market-data-strategy-matters'] || '', thumbnail_url:null, category:'Data', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:6, view_count:980, is_featured:true, is_popular:true, published_at:'2025-01-10T00:00:00Z', created_at:'', updated_at:'', tags:[{ id:'t2', name:'data-strategy', slug:'data-strategy', created_at:'' }] },
  { id:'3', title:'The Hidden Infrastructure Behind Financial Markets', slug:'hidden-infrastructure-financial-markets', summary:'The technology layers that keep global financial markets running.', content: SAMPLE_CONTENT['hidden-infrastructure-financial-markets'] || '', thumbnail_url:null, category:'Infrastructure', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:8, view_count:756, is_featured:false, is_popular:true, published_at:'2025-01-05T00:00:00Z', created_at:'', updated_at:'', tags:[{ id:'t3', name:'infrastructure', slug:'infrastructure', created_at:'' }] },
  { id:'4', title:'AI Use Cases in Financial Data Governance', slug:'ai-use-cases-financial-data-governance', summary:'AI is transforming how financial institutions govern and distribute market data.', content: SAMPLE_CONTENT['ai-use-cases-financial-data-governance'] || '', thumbnail_url:null, category:'AI', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:6, view_count:634, is_featured:false, is_popular:true, published_at:'2024-12-28T00:00:00Z', created_at:'', updated_at:'', tags:[{ id:'t4', name:'ai', slug:'ai', created_at:'' }] },
  { id:'5', title:'Tokenization and the Future of Market Infrastructure', slug:'tokenization-future-market-infrastructure', summary:'Digital securities and tokenized assets reshaping markets.', content: SAMPLE_CONTENT['tokenization-future-market-infrastructure'] || '', thumbnail_url:null, category:'Digital Assets', language:'en', translation_group_id:null, status:'published', author_id:'', source_url:null, seo_title:null, seo_description:null, og_image_url:null, reading_time:7, view_count:512, is_featured:false, is_popular:false, published_at:'2024-12-20T00:00:00Z', created_at:'', updated_at:'', tags:[{ id:'t5', name:'tokenization', slug:'tokenization', created_at:'' }] },
]

export async function generateStaticParams() {
  return SAMPLE_POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let post: Post | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('posts').select('title, summary, og_image_url, seo_title, seo_description').eq('slug', slug).single()
    post = data as unknown as Post
  } catch {}
  if (!post) post = SAMPLE_POSTS.find(p => p.slug === slug) || null
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
    post = SAMPLE_POSTS.find(p => p.slug === slug) || null
    if (!post) notFound()
    relatedPosts = SAMPLE_POSTS.filter(p => p.category === post!.category && p.slug !== slug).slice(0, 3)
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

      console.log('[translation] cache read — found:', !!cached, 'error:', cacheReadErr)

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
        console.log('[translation] OpenAI result — isAI:', result.isAI, 'summary:', result.summary?.slice(0, 60))
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
            console.log('[translation] cache write — error:', upsertErr)
          } catch (cacheErr) {
            console.error('[translation cache] upsert threw:', cacheErr)
          }
        }
      }
      // 3. If no AI key and no cache: fall through — show original with notice below
    } catch (err) {
      console.error('[translation] error:', err)
    }
  }

  const originalLangName = LOCALE_NAMES[post.language] ?? post.language

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
    <div className="bg-white">
      <ReadingProgress />
      {/* Back */}
      <div className="border-b border-[#E5E7EB]">
        <div className="content-width py-4">
          <Link
            href={`/${post.category.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0F172A] transition-colors"
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
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <Languages size={16} className={`flex-shrink-0 mt-0.5 ${isAITranslated ? 'text-blue-500' : 'text-amber-500'}`} />
              <div>
                {isAITranslated ? (
                  <p className="text-blue-800">
                    Automatically translated from {originalLangName} by AI. Terminology may vary — view the{' '}
                    <Link href={`/posts/${slug}`} locale={post.language as 'en' | 'ko' | 'zh'} className="underline font-medium">
                      original {originalLangName} version
                    </Link>.
                  </p>
                ) : (
                  <p className="text-amber-800">
                    This post was written in {originalLangName}. Automatic translation requires{' '}
                    <code className="bg-amber-100 px-1 rounded text-xs">OPENAI_API_KEY</code> to be configured.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Category */}
          <span className="inline-block px-3 py-1 rounded-full bg-[#0F172A] text-white text-xs font-semibold mb-6 capitalize">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] leading-tight mb-6 tracking-tight">
            {displayTitle}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280] mb-6 pb-6 border-b border-[#E5E7EB]">
            <span className="font-medium text-[#0F172A]">{t('by')} Harry D. Hwang</span>
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
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                <Languages size={12} /> AI Translated
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span key={tag.id} className="px-3 py-1 rounded-full text-xs bg-[#F8FAFC] border border-[#E5E7EB] text-[#4B5563]">
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
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] mb-8">
              <p className="text-[#4B5563] text-lg leading-relaxed italic">{displaySummary}</p>
            </div>
          )}

          {/* Content */}
          <div
            className="article-body text-[#111827] text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayContent || '<p>Content coming soon.</p>' }}
          />

          {/* Share */}
          <div className="flex items-center gap-3 mt-12 pt-8 border-t border-[#E5E7EB]">
            <span className="text-sm font-medium text-[#4B5563] flex items-center gap-2">
              <Share2 size={16} /> Share:
            </span>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(displayTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
            >
              LinkedIn
            </a>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 p-6 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">{t('disclaimer')}</p>
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
        <section className="py-16 bg-[#F8FAFC]">
          <div className="content-width">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-8">{t('relatedPosts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rp => (
                <Link key={rp.id} href={`/posts/${rp.slug}`} className="group block p-6 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#38BDF8]/40 hover:shadow-md transition-all">
                  <span className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">{rp.category}</span>
                  <h3 className="text-sm font-bold text-[#0F172A] mt-2 leading-snug group-hover:text-[#1E3A5F] transition-colors line-clamp-2">{rp.title}</h3>
                  <p className="text-xs text-[#6B7280] mt-2 line-clamp-2">{rp.summary}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-[#6B7280]">
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
