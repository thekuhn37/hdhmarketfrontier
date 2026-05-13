import type { ArticleContent, SeoData, ChartData } from '../../types/index.js';
import { supabase } from '../../lib/supabaseAdmin.js';
import { estimateReadingTime, slugify } from '../../utils/format.js';
import { logger } from '../../utils/logger.js';

const ADMIN_EMAIL = 'harryhwang37@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hdhmarketfrontier.com';

async function getAdminUserId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (error || !data) {
    logger.warn(`Could not find admin user by email: ${error?.message}`);
    return null;
  }

  return data.id as string;
}

function embedCharts(content: string, charts: ChartData): string {
  const chartsHtml = `
<div>
  <img src="${charts.equityChartUrl}" alt="Global Equity Markets Daily % Change Chart" style="max-width:100%;height:auto;" />
  <img src="${charts.fxChartUrl}" alt="FX Rates Daily % Change Chart" style="max-width:100%;height:auto;" />
  <img src="${charts.commodityChartUrl}" alt="Commodities and Crypto Daily % Change Chart" style="max-width:100%;height:auto;" />
</div>`;

  const insertAfter = '</h2>';
  const idx = content.indexOf(insertAfter);
  if (idx !== -1) {
    return content.slice(0, idx + insertAfter.length) + chartsHtml + content.slice(idx + insertAfter.length);
  }

  return chartsHtml + content;
}

async function ensureUniqueSlug(baseSlug: string, date: string): Promise<string> {
  const { data } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', baseSlug)
    .maybeSingle();

  if (!data) return baseSlug;

  const withDate = `${baseSlug}-${date}`;
  const { data: data2 } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', withDate)
    .maybeSingle();

  if (!data2) return withDate;

  return `${withDate}-${Date.now()}`;
}

export async function uploadDraft(
  article: ArticleContent,
  seo: SeoData,
  charts: ChartData,
): Promise<{ postId: string; editUrl: string }> {
  logger.info('Uploading draft to CMS...');

  const authorId = await getAdminUserId();
  const contentWithCharts = embedCharts(article.content, charts);
  const date = new Date().toISOString().slice(0, 10);
  const baseSlug = seo.slug || slugify(article.title);
  const slug = await ensureUniqueSlug(baseSlug, date);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: article.title,
      slug,
      summary: article.summary,
      content: contentWithCharts,
      category: 'Markets',
      language: 'en',
      status: 'draft',
      author_id: authorId,
      seo_title: seo.seoTitle,
      seo_description: seo.seoDescription,
      reading_time: estimateReadingTime(contentWithCharts),
      is_featured: false,
      is_popular: false,
      published_at: null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert post: ${error?.message}`);
  }

  const postId = data.id as string;
  const editUrl = `${SITE_URL}/en/admin/posts/${postId}`;

  logger.info(`Draft uploaded: ${editUrl}`);
  return { postId, editUrl };
}
