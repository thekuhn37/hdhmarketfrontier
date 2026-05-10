/**
 * AI Summary Generation Service
 *
 * Current: Returns a basic extractive summary if no LLM is configured.
 * Future: Connect OPENAI_API_KEY or LLM_API_KEY to generate high-quality summaries.
 *
 * To enable LLM summaries:
 * 1. Set OPENAI_API_KEY in .env.local
 * 2. Install: npm install openai
 * 3. Uncomment and configure the OpenAI section below
 */

export async function generateSummary(content: string): Promise<string> {
  // Strip HTML tags for text extraction
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // LLM-powered summary (uncomment when API key is available)
  /*
  if (process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial market analyst. Generate a concise 2-3 sentence summary of the following article, focusing on key insights for financial industry professionals.'
        },
        { role: 'user', content: text.slice(0, 4000) }
      ],
      max_tokens: 150,
    })
    return response.choices[0]?.message?.content || extractiveSummary(text)
  }
  */

  // Fallback: extractive summary (first 2 meaningful sentences)
  return extractiveSummary(text)
}

function extractiveSummary(text: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 30 && s.length < 400)
    .slice(0, 2)
  return sentences.join(' ').trim() || text.slice(0, 200)
}

/**
 * AI Draft Generation Service
 *
 * Architecture for future AI-powered draft creation from market data sources.
 * Supports:
 * - Daily market brief (from Yahoo Finance or similar APIs)
 * - Topic analysis from news aggregators
 * - Structured research drafts
 *
 * To enable:
 * 1. Set up Yahoo Finance API or news API key
 * 2. Set OPENAI_API_KEY
 * 3. Create a cron job or scheduled function
 */

export interface PostFields {
  title: string
  slug: string
  seo_title: string
  seo_description: string
}

/**
 * Generate post title, slug, SEO title, and SEO description from content.
 *
 * To enable LLM generation:
 * 1. Set OPENAI_API_KEY in .env.local
 * 2. npm install openai
 * 3. Uncomment the OpenAI block below
 */
export async function generatePostFields(content: string): Promise<PostFields> {
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // LLM-powered field generation (uncomment when API key is available)
  /*
  if (process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an SEO expert for a professional financial markets blog (hdhmarketfrontier.com).
Given blog post content, generate:
- A compelling, specific post title (max 70 chars) — avoid generic phrases
- A URL-friendly slug (lowercase, hyphens only, no stop words)
- An SEO title optimized for search (max 60 chars)
- An SEO meta description that summarizes key insight and encourages clicks (max 160 chars)
Respond ONLY with valid JSON.`
        },
        {
          role: 'user',
          content: `Generate post fields for this content:\n\n${text.slice(0, 4000)}\n\nRespond as JSON: {"title":"...","slug":"...","seo_title":"...","seo_description":"..."}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })
    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{}') as Partial<PostFields>
      if (result.title && result.slug && result.seo_title && result.seo_description) {
        return result as PostFields
      }
    } catch {}
  }
  */

  return extractivePostFields(text)
}

function extractivePostFields(text: string): PostFields {
  // Title: first heading line or first complete sentence
  const headingMatch = text.match(/^#+\s*(.+)$/m)
  const firstSentence = text.split(/[.!?]\s+/)[0] || ''
  const rawTitle = (headingMatch?.[1] || firstSentence).replace(/^#+\s*/, '').trim()
  const title = rawTitle.slice(0, 70) || 'Untitled Post'

  // Slug: slugify the title
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  // SEO title: title trimmed to 60 chars
  const seo_title = title.slice(0, 60)

  // SEO description: first 1-2 meaningful sentences, max 160 chars
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 40)
  const combined = sentences.slice(0, 2).join(' ')
  const seo_description = (combined || text).slice(0, 160).trimEnd()

  return { title, slug, seo_title, seo_description }
}

export interface DraftGenerationInput {
  source_type: 'market_brief' | 'news_analysis' | 'topic_research'
  topic?: string
  category?: 'Markets' | 'Data' | 'Infrastructure' | 'AI' | 'Digital Assets'
  source_data?: Record<string, unknown>
}

export async function generateDraft(input: DraftGenerationInput): Promise<{
  title: string
  summary: string
  content: string
}> {
  // Mock implementation - replace with real LLM integration
  const mockData = {
    'market_brief': {
      title: `Market Daily Brief — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      summary: 'AI-generated daily market brief covering major indices, key movers, and notable market events.',
      content: `<p><em>This is an AI-generated draft. Please review and edit before publishing.</em></p>
<h2>Market Overview</h2>
<p>[AI-generated content would appear here after connecting LLM API and market data sources]</p>
<p><strong>Disclaimer:</strong> This content is for informational purposes only and does not constitute investment advice.</p>`,
    },
    'news_analysis': {
      title: `${input.topic || 'Market Analysis'} — ${new Date().toLocaleDateString()}`,
      summary: `Analysis of ${input.topic || 'recent market developments'} and their implications.`,
      content: `<p><em>AI-generated draft. Review before publishing.</em></p><h2>Analysis</h2><p>[Content placeholder]</p>`,
    },
    'topic_research': {
      title: `Deep Dive: ${input.topic || input.category || 'Financial Markets'}`,
      summary: `A comprehensive exploration of ${input.topic || input.category} trends and developments.`,
      content: `<p><em>AI-generated draft. Review before publishing.</em></p><h2>Overview</h2><p>[Content placeholder]</p>`,
    },
  }

  return mockData[input.source_type] || mockData['market_brief']
}
