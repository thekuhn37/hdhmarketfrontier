import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { url } = await req.json() as { url: string }

  if (!url?.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Block LinkedIn/FISD automated fetch — require manual paste
  if (url.includes('linkedin.com') || url.includes('fisd.net')) {
    return NextResponse.json({
      blocked: true,
      message: 'LinkedIn and FISD require manual access. Please log in to your browser and paste the job text or upload a saved copy.',
    })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({
        blocked: true,
        message: `This page returned HTTP ${res.status}. It may require login or block automated access. Please paste the job text manually.`,
      })
    }

    const html = await res.text()
    // Strip HTML tags to extract readable text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 15000)

    return NextResponse.json({ content: text, blocked: false })
  } catch (err) {
    return NextResponse.json({
      blocked: true,
      message: `Could not fetch this URL: ${err instanceof Error ? err.message : 'Network error'}. Please paste the job text manually.`,
    })
  }
}
