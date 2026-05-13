import type { SeoData } from '../../types/index.js';
import { chatComplete } from '../../lib/openaiClient.js';
import { buildSeoPrompt } from '../../prompts/seoPrompt.js';
import { slugify } from '../../utils/format.js';
import { logger } from '../../utils/logger.js';

export async function generateSeo(title: string, summary: string, date: string): Promise<SeoData> {
  logger.info('Generating SEO data...');

  try {
    const prompt = buildSeoPrompt(title, summary, date);
    const raw = await chatComplete(
      [{ role: 'user', content: prompt }],
      'gpt-4o-mini',
      400,
    );

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as {
      seoTitle: string;
      seoDescription: string;
      slug: string;
      tags: string[];
    };

    const result: SeoData = {
      seoTitle: (parsed.seoTitle ?? title).slice(0, 60),
      seoDescription: (parsed.seoDescription ?? summary).slice(0, 160),
      slug: parsed.slug ?? slugify(title),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };

    logger.info('SEO data generated.');
    return result;
  } catch (err) {
    logger.warn(`SEO generation failed, using fallback: ${err}`);
    return {
      seoTitle: title.slice(0, 60),
      seoDescription: summary.slice(0, 160),
      slug: slugify(title),
      tags: ['markets', 'global markets', 'daily briefing', 'finance', 'investing'],
    };
  }
}
