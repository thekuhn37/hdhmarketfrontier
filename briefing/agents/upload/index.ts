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
  const valid = (url: string) => url && url.startsWith('http');
  const chartImgs = [
    valid(charts.equityChartUrl)
      ? `<p><img src="${charts.equityChartUrl}" alt="Global Equity Markets — Weekly % Change" style="max-width:100%;height:auto;border-radius:8px;" /></p>`
      : '',
    valid(charts.fxChartUrl)
      ? `<p><img src="${charts.fxChartUrl}" alt="FX Rates — Weekly % Change" style="max-width:100%;height:auto;border-radius:8px;" /></p>`
      : '',
    valid(charts.commodityChartUrl)
      ? `<p><img src="${charts.commodityChartUrl}" alt="Commodities & Crypto — Weekly % Change" style="max-width:100%;height:auto;border-radius:8px;" /></p>`
      : '',
  ].filter(Boolean);

  if (chartImgs.length === 0) return content;
  const chartsHtml = '\n' + chartImgs.join('\n') + '\n';

  // Insert BEFORE the second <h2> so charts appear after the Executive Summary text, not before it
  const firstH2 = content.indexOf('<h2');
  if (firstH2 !== -1) {
    const secondH2 = content.indexOf('<h2', firstH2 + 4);
    if (secondH2 !== -1) {
      return content.slice(0, secondH2) + chartsHtml + content.slice(secondH2);
    }
  }

  // Fallback: append at end
  return content + chartsHtml;
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
