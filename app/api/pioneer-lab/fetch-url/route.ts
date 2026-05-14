import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ---------------------------------------------------------------------------
// HTML utilities
// ---------------------------------------------------------------------------

function extractJsonLd(html: string): Record<string, unknown> | null {
  const matches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim()) as Record<string, unknown>
      if (parsed['@type'] === 'JobPosting' || parsed.title) return parsed
    } catch { /* skip malformed blocks */ }
  }
  return null
}

function extractMetaTag(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]+)"`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+(?:name|property)="${name}"`, 'i'))
  return m?.[1] ?? ''
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|li|div|h[1-6]|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractReadableText(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  return stripHtmlTags(cleaned)
}

// ---------------------------------------------------------------------------
// LinkedIn-specific parsing
// ---------------------------------------------------------------------------

function formatLinkedInLocation(jobLocation: unknown): string {
  if (!jobLocation) return ''
  const loc = jobLocation as Record<string, unknown>
  const addr = loc.address as Record<string, unknown> | undefined
  if (!addr) return typeof loc === 'string' ? loc : ''
  return [addr.addressLocality, addr.addressRegion, addr.addressCountry]
    .filter(Boolean)
    .join(', ')
}

function formatSalary(baseSalary: unknown): string {
  if (!baseSalary) return 'Not disclosed'
  const sal = baseSalary as Record<string, unknown>
  const val = sal.value as Record<string, unknown> | undefined
  if (!val) return 'Not disclosed'
  const currency = (sal.currency as string) ?? ''
  const min = val.minValue as number | undefined
  const max = val.maxValue as number | undefined
  const unit = (val.unitText as string ?? 'YEAR').toLowerCase()
  if (min && max) return `${currency} ${min.toLocaleString()}–${max.toLocaleString()} / ${unit}`
  if (min) return `${currency} ${min.toLocaleString()} / ${unit}`
  return 'Not disclosed'
}

// Map LinkedIn JSON-LD → pre-filled job fields (no AI needed for these)
function mapJsonLdToJob(ld: Record<string, unknown>): Record<string, unknown> {
  const org = ld.hiringOrganization as Record<string, unknown> | undefined

  return {
    position_title: (ld.title as string) ?? '',
    company_name: (org?.name as string) ?? '',
    job_description: ld.description
      ? stripHtmlTags(ld.description as string).slice(0, 4000)
      : '',
    employment_type: ((ld.employmentType as string) ?? '').replace('_', '-') || null,
    posted_date: (ld.datePosted as string)?.slice(0, 10) ?? null,
    closing_date: (ld.validThrough as string)?.slice(0, 10) ?? null,
    location: formatLinkedInLocation(ld.jobLocation),
    expected_salary: formatSalary(ld.baseSalary),
    source_platform: 'LinkedIn',
  }
}

// ---------------------------------------------------------------------------
// Main fetcher
// ---------------------------------------------------------------------------

async function fetchPage(url: string, liAt?: string): Promise<{ html: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': BROWSER_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  }

  const cookieParts: string[] = []

  // LinkedIn-specific cookie injection
  const isLinkedIn = url.includes('linkedin.com')
  if (isLinkedIn) {
    const token = liAt ?? process.env.LINKEDIN_LI_AT ?? ''
    if (token) {
      cookieParts.push(`li_at=${token}`)
      // LinkedIn also needs a CSRF token — derive a placeholder; real pages use JSESSIONID
      cookieParts.push('lang=v=2&lang=en-us')
    }
    headers['Referer'] = 'https://www.linkedin.com/'
    headers['sec-ch-ua'] = '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"'
    headers['sec-ch-ua-mobile'] = '?0'
    headers['sec-ch-ua-platform'] = '"Windows"'
  }

  if (cookieParts.length) headers['Cookie'] = cookieParts.join('; ')

  const res = await fetch(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  })

  const html = await res.text()
  return { html, status: res.status }
}

// ---------------------------------------------------------------------------
// API route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { url: string; liAt?: string }
  const { url, liAt } = body

  if (!url?.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const { html, status } = await fetchPage(url, liAt)

    // Detect login wall
    const isLoginWall = html.includes('join-login') || html.includes('authwall') ||
      html.includes('uas/login') || html.includes('sign-in-modal') ||
      (url.includes('linkedin.com') && html.includes('guest_homepage'))

    if (isLoginWall) {
      return NextResponse.json({
        blocked: true,
        needsLogin: true,
        message: url.includes('linkedin.com')
          ? 'LinkedIn requires a session cookie (li_at) to access this page. Paste your li_at value in the "LinkedIn Cookie" field above, then try again.'
          : 'This page requires login. Please paste the job text manually.',
      })
    }

    if (status === 429) {
      return NextResponse.json({
        blocked: true,
        message: 'Rate limited by the server. Wait a few minutes and try again, or paste the job text manually.',
      })
    }

    if (status >= 400) {
      return NextResponse.json({
        blocked: true,
        message: `Server returned HTTP ${status}. This page may require login or block automated access. Try pasting the content manually.`,
      })
    }

    // Extract structured data
    const jsonLd = extractJsonLd(html)
    const preMappedFields = jsonLd ? mapJsonLdToJob(jsonLd) : null
    const rawText = extractReadableText(html).slice(0, 15000)

    // Build a rich content payload for AI
    const content = [
      jsonLd ? `=== STRUCTURED JOB DATA (JSON-LD) ===\n${JSON.stringify(jsonLd, null, 2).slice(0, 6000)}` : null,
      `=== PAGE TEXT ===\n${rawText}`,
    ].filter(Boolean).join('\n\n')

    return NextResponse.json({
      blocked: false,
      content,
      preMappedFields,
      title: extractMetaTag(html, 'og:title') || extractMetaTag(html, 'title'),
    })
  } catch (err) {
    return NextResponse.json({
      blocked: true,
      message: `Fetch failed: ${err instanceof Error ? err.message : 'Network error'}. Please paste the job text manually.`,
    })
  }
}

