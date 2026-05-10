/**
 * Post translation service.
 *
 * When OPENAI_API_KEY is set: translates title, summary, and content via GPT-4o-mini.
 * Otherwise: returns original content unchanged (caller shows a "not available" notice).
 *
 * To enable:
 *   1. Set OPENAI_API_KEY in .env.local
 *   2. npm install openai
 */

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
  const langName = LANG_NAMES[targetLocale] ?? targetLocale

  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional financial translator specialising in capital markets.
Translate the provided blog post to ${langName}.
Rules:
- Preserve ALL HTML tags exactly — only translate text between tags.
- Keep proper nouns, ticker symbols, and technical acronyms (e.g. MiFID II, CCP, T+2) unchanged.
- Respond ONLY with a JSON object: {"title":"...","summary":"...","content":"..."}
- If summary is null, return null for summary.`,
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
      })

      const raw = response.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(raw) as Partial<TranslationInput>

      return {
        title: parsed.title || input.title,
        summary: parsed.summary ?? input.summary,
        content: parsed.content || input.content,
        isAI: true,
      }
    } catch {
      // Fall through — return original below
    }
  }

  return { ...input, isAI: false }
}
