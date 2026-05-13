import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const DEFAULT_MODEL = 'gpt-4o-mini';

export async function chatComplete(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model = DEFAULT_MODEL,
  maxTokens = 2000,
): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
  });
  return response.choices[0]?.message?.content ?? '';
}
