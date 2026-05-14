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

const EXTRACTION_SYSTEM_PROMPT = `You are a professional job market analyst specializing in financial data, market infrastructure, and fintech industries. Your task is to extract structured information from job posting text and return it as clean JSON.

Harry D. Hwang's target profile:
- Financial market infrastructure professional
- Expertise: market data, exchange strategy, data licensing, market structure
- Interest areas: fintech, AI in finance, digital assets, global business development
- Senior-level positions at exchanges, market data vendors, financial information providers

Relevance scoring rules (0–100):
- 80–100: Direct match — market data, exchange, infrastructure, data licensing, fintech strategy, AI in finance
- 60–79: Strong match — related financial services, data roles, digital assets, regulatory tech
- 40–59: Moderate match — adjacent financial roles, product/BD at financial firms
- 20–39: Weak match — general tech/finance overlap
- 0–19: Irrelevant

Return ONLY valid JSON. No prose, no markdown, no code fences.`

export async function extractJobFromText(
  rawText: string,
  sourceUrl?: string,
  sourcePlatform?: string,
  keywords?: string,
): Promise<Partial<PioneerJobPost>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return manualParseJob(rawText, sourceUrl, sourcePlatform)

  const prompt = `Extract structured job data from the text below.

${keywords ? `Admin focus keywords: ${keywords}\nScore relevance higher if this job matches these keywords.` : ''}
${sourceUrl ? `Source URL: ${sourceUrl}` : ''}
${sourcePlatform ? `Source platform: ${sourcePlatform}` : ''}

Return this exact JSON structure (use null for missing fields, [] for empty arrays):
{
  "company_name": "",
  "company_category": "",
  "position_title": "",
  "function_type": "",
  "job_description": "",
  "expected_salary": "",
  "posted_date": null,
  "closing_date": null,
  "location": "",
  "source_platform": "",
  "remote_type": null,
  "seniority_level": null,
  "employment_type": null,
  "required_skills": [],
  "preferred_skills": [],
  "ai_relevance_score": 0,
  "ai_relevance_explanation": ""
}

company_category must be one of: ${COMPANY_CATEGORIES.join(', ')}
function_type must be one of: ${FUNCTION_TYPES.join(', ')}
expected_salary: extract if present; otherwise "Not disclosed"
posted_date / closing_date: ISO date format (YYYY-MM-DD) or null
ai_relevance_score: integer 0–100 based on Harry's profile
ai_relevance_explanation: 1–2 sentences explaining the score

JOB TEXT:
${rawText.slice(0, 8000)}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
    const data = await res.json() as { choices: { message: { content: string } }[] }
    const content = data.choices?.[0]?.message?.content ?? ''

    const extracted = JSON.parse(content) as Partial<PioneerJobPost>
    return {
      ...extracted,
      source_link: sourceUrl ?? null,
      source_platform: sourcePlatform ?? extracted.source_platform ?? 'Other',
      raw_content: rawText.slice(0, 10000),
    }
  } catch (err) {
    console.error('[job-extraction] AI extraction failed:', err)
    return manualParseJob(rawText, sourceUrl, sourcePlatform)
  }
}

function manualParseJob(
  rawText: string,
  sourceUrl?: string,
  sourcePlatform?: string,
): Partial<PioneerJobPost> {
  const lines = rawText.split('\n').filter(Boolean)
  return {
    company_name: lines[0]?.slice(0, 120) ?? '',
    position_title: lines[1]?.slice(0, 120) ?? '',
    job_description: rawText.slice(0, 2000),
    expected_salary: 'Not disclosed',
    source_link: sourceUrl ?? null,
    source_platform: sourcePlatform ?? 'Other',
    required_skills: [],
    preferred_skills: [],
    ai_relevance_score: null,
    ai_relevance_explanation: 'AI extraction not configured — data entered manually.',
    raw_content: rawText.slice(0, 10000),
  }
}
