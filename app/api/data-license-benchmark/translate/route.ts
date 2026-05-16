import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * POST /api/data-license-benchmark/translate
 *
 * Two modes:
 *  1. No `targetLanguage` → detect source language, translate to English.
 *     Returns { originalLanguage, translatedText, wasTranslated }
 *
 *  2. `targetLanguage` provided (e.g. "ko") → translate English text to that language.
 *     Returns { translatedText }
 */
export async function POST(req: NextRequest) {
  const body = await req.json() as { text: string; targetLanguage?: string }
  const { text, targetLanguage } = body
  if (!text?.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  // ── Mode 2: translate English answer back to user's language ─────────────
  if (targetLanguage && targetLanguage !== 'en') {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content:
            `You are a professional financial/legal translator. ` +
            `Translate the following English compliance analysis text to ${targetLanguage}. ` +
            `Rules: preserve all exchange names (CME, ASX, LSE, NASDAQ), section numbers (§2.1, Section 3.4), ` +
            `legal terms, and structural markers like [Conclusion], [Supporting Evidence], [Conditions]. ` +
            `Return only the translated text — no explanation, no markdown fences.`,
        },
        { role: 'user', content: text },
      ],
    })
    const translated = completion.choices[0].message.content ?? text
    return NextResponse.json({ translatedText: translated })
  }

  // ── Mode 1: detect language + translate to English ────────────────────────
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content:
          'You are a translation assistant. Detect the language of the user message. ' +
          'If it is already English, respond with JSON: {"lang":"en","translated":null}. ' +
          'If it is any other language, translate it to clear financial/legal English and respond with JSON: ' +
          '{"lang":"<ISO-639-1 code>","translated":"<English translation>"}. ' +
          'Respond with raw JSON only — no markdown, no explanation.',
      },
      { role: 'user', content: text },
    ],
  })

  const raw = completion.choices[0].message.content ?? ''
  try {
    const parsed = JSON.parse(raw) as { lang: string; translated: string | null }
    return NextResponse.json({
      originalLanguage: parsed.lang,
      translatedText: parsed.translated ?? text,
      wasTranslated: parsed.translated !== null,
    })
  } catch {
    return NextResponse.json({ originalLanguage: 'en', translatedText: text, wasTranslated: false })
  }
}
