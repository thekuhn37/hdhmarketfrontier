import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Simple in-memory rate limit (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }) // 1 hour
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, organization, subject, message, consent } = body as {
    name?: string; email?: string; organization?: string
    subject?: string; message?: string; consent?: boolean
  }

  if (!name || !email || !subject || !message || !consent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (message.length < 10) {
    return NextResponse.json({ error: 'Message is too short' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('contact_messages').insert({
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      organization: organization ? String(organization).slice(0, 200) : null,
      subject: String(subject).slice(0, 500),
      message: String(message).slice(0, 5000),
      status: 'unread',
    })
  } catch (err) {
    console.error('Supabase insert error:', err)
    // Don't fail the request if DB insert fails - log and continue
  }

  // Email notification via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'HDH Market Frontier <noreply@hdhmarketfrontier.com>',
        to: process.env.CONTACT_RECEIVER_EMAIL || 'contact@hdhmarketfrontier.com',
        subject: `[Contact] ${subject}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
          ${organization ? `<p><strong>Organization:</strong> ${escapeHtml(organization)}</p>` : ''}
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr />
          <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
        `,
      })
    } catch (err) {
      console.error('Email send error:', err)
    }
  }

  return NextResponse.json({ success: true })
}
