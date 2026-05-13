import Parser from 'rss-parser';
import type { NewsItem } from '../../types/index.js';
import { withRetry } from '../../utils/retry.js';
import { logger } from '../../utils/logger.js';

const RSS_FEEDS = [
  'https://feeds.marketwatch.com/marketwatch/topstories/',
  'https://finance.yahoo.com/news/rss/',
  'https://www.cnbc.com/id/10000664/device/rss/rss.html',
  'https://feeds.reuters.com/reuters/businessNews',
];

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

export async function collectNews(): Promise<NewsItem[]> {
  logger.info('Collecting news...');

  const parser = new Parser();
  const seen = new Set<string>();
  const items: NewsItem[] = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await withRetry(() => parser.parseURL(feedUrl), 3, 1500);
      const feedItems = (feed.items ?? []).slice(0, 5);

      for (const item of feedItems) {
        const url = item.link ?? '';
        if (!url || seen.has(url)) continue;
        seen.add(url);

        const summary = (item.contentSnippet ?? item.content ?? '').replace(/\s+/g, ' ').trim();

        items.push({
          headline: item.title ?? 'Untitled',
          summary: summary.length > 150 ? summary.slice(0, 147) + '...' : summary,
          source: extractDomain(feedUrl),
          url,
          publishedAt: item.pubDate ?? item.isoDate,
        });
      }
    } catch (err) {
      logger.warn(`Failed to parse feed ${feedUrl}: ${err}`);
    }
  }

  const sorted = items.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  const result = sorted.slice(0, 10);
  logger.info(`Collected ${result.length} news items.`);
  return result;
}
