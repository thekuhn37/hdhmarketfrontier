import type { BriefingPipeline, ArticleContent } from '../../types/index.js';
import { chatComplete } from '../../lib/openaiClient.js';
import { buildMarketAnalystPrompt } from '../../prompts/marketAnalystPrompt.js';
import { logger } from '../../utils/logger.js';
import { todayLong } from '../../utils/format.js';

export async function generateAnalysis(pipeline: BriefingPipeline): Promise<ArticleContent> {
  logger.info('Generating market analysis with GPT...');

  const prompt = buildMarketAnalystPrompt(pipeline);
  const dateLong = todayLong();
  const title = `Global Markets at a Glance — ${dateLong} (UTC)`;

  const content = await chatComplete(
    [{ role: 'user', content: prompt }],
    'gpt-4o-mini',
    4000,
  );

  const summaryPrompt = `Write a single concise paragraph (3–4 sentences) summarizing the key themes and market moves from this article. Write in Bloomberg institutional style. Return only the paragraph text, no HTML tags.\n\nArticle:\n${content.slice(0, 3000)}`;

  const summary = await chatComplete(
    [{ role: 'user', content: summaryPrompt }],
    'gpt-4o-mini',
    300,
  );

  logger.info('Analysis generation complete.');

  return { title, content, summary };
}
