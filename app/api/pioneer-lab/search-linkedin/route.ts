import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function extractJobIds(html: string): string[] {
  const ids = new Set<string>()
  for (const m of html.matchAll(/urn:li:jobPosting:(\d+)/g)) ids.add(m[1])
  for (const m of html.matchAll(/fs_normalized_jobPosting:(\d+)/g)) ids.add(m[1])
  for (const m of html.matchAll(/\/jobs\/view\/(\d+)/g)) ids.add(m[1])
  for (const m of html.matchAll(/data-job-id="(\d+)"/g)) ids.add(m[1])
  for (const m of html.matchAll(/"jobId"\s*:\s*(\d+)/g)) ids.add(m[1])
  return [...ids]
}

async function searchPage(url: string, headers: Record<string, string>): Promise<string> {
  const res = await fetch(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 429) throw new Error('RATE_LIMITED')
  return res.text()
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { keywords: string; liAt?: string; location?: string; maxResults?: number }
  const { keywords, liAt, location = '', maxResults = 25 } = body

  if (!keywords?.trim()) {
    return NextResponse.json({ error: 'Keywords required' }, { status: 400 })
  }

  const token = liAt ?? process.env.LINKEDIN_LI_AT ?? ''

  const headers: Record<string, string> = {
    'User-Agent': BROWSER_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.linkedin.com/jobs/',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  }

  if (token) {
    headers['Cookie'] = `li_at=${token}; lang=v=2&lang=en-us`
  }

  try {
    // Primary: LinkedIn guest jobs API — returns pre-rendered HTML with job cards
    const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&start=0`
    let html = await searchPage(guestUrl, headers)

    const isLoginWall = (html.includes('join-login') || html.includes('authwall') ||
      html.includes('uas/login') || html.includes('guest_homepage'))

    if (isLoginWall) {
      return NextResponse.json({
        blocked: true,
        needsLogin: true,
        message: 'LinkedIn requires a valid li_at session cookie. Paste yours in the cookie field and try again.',
      })
    }

    let ids = extractJobIds(html)

    // Fallback: main job search page (richer with auth)
    if (ids.length === 0 && token) {
      const mainUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r2592000`
      html = await searchPage(mainUrl, headers)
      ids = extractJobIds(html)
    }

    const urls = ids.slice(0, maxResults).map(id => `https://www.linkedin.com/jobs/view/${id}/`)

    return NextResponse.json({
      blocked: false,
      urls,
      count: urls.length,
      message: urls.length === 0
        ? 'No jobs found. Try broader keywords, or check your li_at cookie is still valid.'
        : undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    if (msg === 'RATE_LIMITED') {
      return NextResponse.json({ blocked: true, message: 'LinkedIn rate limited this request. Wait a few minutes and try again.' })
    }
    return NextResponse.json({ blocked: true, message: `Search failed: ${msg}` })
  }
}
