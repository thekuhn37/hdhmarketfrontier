import type { PioneerJobPost } from '@/lib/supabase/types'

export const COMPANY_CATEGORIES = [
  'Exchange', 'Market Data Vendor', 'Index Provider', 'Financial Information Provider',
  'Trading Technology', 'Market Infrastructure', 'Fintech', 'Data Infrastructure',
  'AI / Analytics', 'Digital Assets', 'RegTech / SupTech', 'Asset Management',
  'Broker / Dealer', 'Bank', 'Consulting', 'Government / Regulator',
  'Academic / Research', 'Other',
]

export const FUNCTION_TYPES = [
  'Market Data', 'Data Strategy', 'Business Development', 'Product Management',
  'Sales / Account Management', 'Exchange Strategy', 'Market Structure',
  'Data Licensing', 'Data Governance', 'AI / Data Science', 'Engineering',
  'Cloud / Infrastructure', 'Digital Assets', 'Research', 'Regulation / Policy',
  'Operations', 'Other',
]

export const JOB_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'interesting', label: 'Interesting' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'archived', label: 'Archived' },
  { value: 'closed', label: 'Closed' },
  { value: 'hiring_completed', label: 'Hiring Completed' },
]

export const SOURCE_PLATFORMS = [
  'LinkedIn', 'FISD', 'Company Website', 'Greenhouse', 'Lever', 'Ashby',
  'Workday', 'Indeed', 'Other',
]

export const LOCATIONS = [
  'Korea', 'Singapore', 'Hong Kong', 'UK', 'Switzerland', 'US', 'Remote', 'Other',
]

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a senior career intelligence analyst specializing in financial market infrastructure, market data, and fintech. You extract structured job data from raw text or JSON and return clean JSON.

TARGET PROFILE — Harry D. Hwang:
- 10+ years in financial market data and exchange strategy
- Deep expertise in market data licensing, data governance, exchange connectivity
- Target roles: Market Data, Exchange Strategy, Business Development, Data Licensing, Market Structure
- Target companies: exchanges, market data vendors, index providers, financial data firms
- Preferred locations: Asia-Pacific (Singapore, Hong Kong, Korea), UK, Switzerland, US
- Senior/leadership positions preferred (VP, Director, Head, Senior Manager+)

RELEVANCE SCORING (0–100):
90–100: Perfect match — market data, exchange strategy, data licensing, market structure roles at tier-1 firms
75–89: Strong match — adjacent data/strategy roles at major financial firms, or perfect-function roles at smaller firms
55–74: Moderate match — fintech/digital assets/AI-finance with significant data or strategy component
35–54: Weak match — general financial services or tech role with some overlap
0–34: Irrelevant

Return ONLY valid compact JSON on a single line. No markdown. No explanation outside the JSON.`

// ---------------------------------------------------------------------------
// Main extractor
// ---------------------------------------------------------------------------

export async function extractJobFromText(
  rawText: string,
  sourceUrl?: string,
  sourcePlatform?: string,
  keywords?: string,
  preMappedFields?: Record<string, unknown> | null,
): Promise<Partial<PioneerJobPost>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return manualParseJob(rawText, sourceUrl, sourcePlatform, preMappedFields)

  // Build the prompt — if we already have pre-mapped fields from JSON-LD,
  // instruct the model to enrich them rather than re-extract from scratch.
  const preFilledNote = preMappedFields
    ? `The following fields were already extracted from structured page data. Preserve them unless the job text clearly contradicts them. Focus your effort on the fields marked NEEDS_AI:\n${JSON.stringify(preMappedFields, null, 2)}\n\n`
    : ''

  const prompt = `${preFilledNote}Extract ALL fields from the job content below and return one JSON object.
${keywords ? `\nAdmin priority keywords: "${keywords}" — weight relevance score higher when the job matches these.\n` : ''}
${sourceUrl ? `Source URL: ${sourceUrl}` : ''}
${sourcePlatform ? `Platform: ${sourcePlatform}` : ''}

JSON schema (every key required — use null for unknown, [] for unknown arrays):
{
  "company_name": string,
  "company_category": string,           // NEEDS_AI: one of [${COMPANY_CATEGORIES.join(' | ')}]
  "position_title": string,
  "function_type": string,              // NEEDS_AI: one of [${FUNCTION_TYPES.join(' | ')}]
  "job_description": string,            // clean prose summary ≤ 600 words, no HTML
  "expected_salary": string,            // exact string if found; else "Not disclosed"
  "posted_date": string | null,         // ISO date YYYY-MM-DD
  "closing_date": string | null,        // ISO date YYYY-MM-DD
  "location": string,                   // city/country, e.g. "Singapore" or "London, UK"
  "remote_type": string | null,         // "Remote" | "Hybrid" | "On-site" | null
  "seniority_level": string | null,     // e.g. "Senior" "Director" "VP" "Entry-level"
  "employment_type": string | null,     // "Full-time" | "Part-time" | "Contract" | null
  "source_platform": string,            // NEEDS_AI if not pre-filled
  "required_skills": string[],          // NEEDS_AI: concrete skills, tools, certs mentioned as required
  "preferred_skills": string[],         // NEEDS_AI: skills mentioned as preferred/nice-to-have
  "ai_relevance_score": number,         // NEEDS_AI: integer 0–100
  "ai_relevance_explanation": string    // NEEDS_AI: 2 sentences max — why this score
}

JOB CONTENT:
${rawText.slice(0, 10000)}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`OpenAI ${res.status}`)
    const data = await res.json() as { choices: { message: { content: string } }[] }
    const content = data.choices?.[0]?.message?.content ?? '{}'

    const extracted = JSON.parse(content) as Partial<PioneerJobPost>

    // Merge: pre-mapped fields win for factual data; AI wins for semantic fields
    const merged: Partial<PioneerJobPost> = {
      ...extracted,
      ...(preMappedFields as Partial<PioneerJobPost>),
      // Always trust AI for these semantic fields
      company_category: extracted.company_category ?? 'Other',
      function_type: extracted.function_type ?? 'Other',
      required_skills: extracted.required_skills ?? [],
      preferred_skills: extracted.preferred_skills ?? [],
      ai_relevance_score: extracted.ai_relevance_score ?? null,
      ai_relevance_explanation: extracted.ai_relevance_explanation ?? null,
      source_link: sourceUrl ?? null,
      source_platform: (preMappedFields?.source_platform as string) ?? sourcePlatform ?? extracted.source_platform ?? 'Other',
      raw_content: rawText.slice(0, 10000),
    }

    return merged
  } catch (err) {
    console.error('[job-extraction] AI failed:', err)
    return manualParseJob(rawText, sourceUrl, sourcePlatform, preMappedFields)
  }
}

function manualParseJob(
  rawText: string,
  sourceUrl?: string,
  sourcePlatform?: string,
  preMappedFields?: Record<string, unknown> | null,
): Partial<PioneerJobPost> {
  const lines = rawText.split('\n').filter(Boolean)
  return {
    company_name: (preMappedFields?.company_name as string) ?? lines[0]?.slice(0, 120) ?? '',
    position_title: (preMappedFields?.position_title as string) ?? lines[1]?.slice(0, 120) ?? '',
    job_description: (preMappedFields?.job_description as string) ?? rawText.slice(0, 2000),
    expected_salary: (preMappedFields?.expected_salary as string) ?? 'Not disclosed',
    location: (preMappedFields?.location as string) ?? '',
    posted_date: (preMappedFields?.posted_date as string) ?? null,
    closing_date: (preMappedFields?.closing_date as string) ?? null,
    employment_type: (preMappedFields?.employment_type as string) ?? null,
    source_link: sourceUrl ?? null,
    source_platform: (preMappedFields?.source_platform as string) ?? sourcePlatform ?? 'Other',
    required_skills: [],
    preferred_skills: [],
    ai_relevance_score: null,
    ai_relevance_explanation: 'AI extraction not configured — fields entered from raw content.',
    raw_content: rawText.slice(0, 10000),
  }
}
