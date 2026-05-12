const LANG_NAMES: Record<string, string> = {
  ko: 'Korean',
  zh: 'Simplified Chinese',
  en: 'English',
}

export interface TranslationInput {
  title: string
  summary: string | null
  content: string
}

export interface TranslationResult extends TranslationInput {
  isAI: boolean
}

export async function translatePost(
  input: TranslationInput,
  targetLocale: string
): Promise<TranslationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ...input, isAI: false }

  const langName = LANG_NAMES[targetLocale] ?? targetLocale

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional financial translator specialising in capital markets.
Translate ALL text fields (title, summary, content) to ${langName}.
Rules:
- Translate title, summary, and content — every field must be in ${langName}.
- Preserve ALL HTML tags exactly — only translate text between tags.
- Keep proper nouns, ticker symbols, and technical acronyms (e.g. MiFID II, CCP, T+2) unchanged.
- If summary is null in the input, return null for summary.
- Respond ONLY with a JSON object: {"title":"...","summary":"...","content":"..."}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              title: input.title,
              summary: input.summary,
              content: input.content.slice(0, 8000),
            }),
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[translatePost] OpenAI error:', res.status, errText)
      return { ...input, isAI: false }
    }

    const json = await res.json() as { choices: { message: { content: string } }[] }
    const raw = json.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as Partial<TranslationInput>

    return {
      title: parsed.title || input.title,
      summary: parsed.summary || input.summary,
      content: parsed.content || input.content,
      isAI: true,
    }
  } catch (err) {
    console.error('[translatePost] fetch failed:', err)
    return { ...input, isAI: false }
  }
}
