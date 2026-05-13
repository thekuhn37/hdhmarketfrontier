import type { BriefingPipeline, BriefingResult } from '../types/index.js';
import { collectMarketData } from '../agents/market-data/index.js';
import { collectNews } from '../agents/news/index.js';
import { collectCalendar } from '../agents/calendar/index.js';
import { generateAnalysis } from '../agents/analysis/index.js';
import { generateCharts } from '../agents/visualization/index.js';
import { generateSeo } from '../agents/seo/index.js';
import { qualityCheck } from '../agents/quality/index.js';
import { uploadDraft } from '../agents/upload/index.js';
import { sendNotification } from '../agents/notify/index.js';
import { logger } from '../utils/logger.js';
import { today, todayLong, weekOf } from '../utils/format.js';

export async function runWeeklyBriefing(): Promise<BriefingResult> {
  const startTime = Date.now();
  const date = today();
  const dateLong = todayLong();
  const weekOfDate = weekOf();

  logger.info(`Starting weekly briefing pipeline for week of ${weekOfDate}`);

  // Agent 1: Market data (required)
  let marketData;
  try {
    marketData = await collectMarketData();
  } catch (err) {
    const error = `Market data collection failed: ${err}`;
    logger.error(error);
    return { success: false, error, duration: Date.now() - startTime };
  }

  // Agent 2: News (optional)
  let news: Awaited<ReturnType<typeof collectNews>> = [];
  try {
    news = await collectNews();
  } catch (err) {
    logger.warn(`News collection failed, continuing without: ${err}`);
  }

  // Agent 3: Calendar (optional)
  let calendar: Awaited<ReturnType<typeof collectCalendar>> = [];
  try {
    calendar = await collectCalendar();
  } catch (err) {
    logger.warn(`Calendar collection failed, continuing without: ${err}`);
  }

  const pipeline: BriefingPipeline = { date, marketData, news, calendar };

  // Agent 4: Generate analysis (required)
  let article;
  try {
    article = await generateAnalysis(pipeline);
  } catch (err) {
    const error = `Analysis generation failed: ${err}`;
    logger.error(error);
    return { success: false, error, duration: Date.now() - startTime };
  }

  // Agent 5: Generate charts (optional)
  let charts: Awaited<ReturnType<typeof generateCharts>> = {
    equityChartUrl: '',
    fxChartUrl: '',
    commodityChartUrl: '',
  };
  try {
    charts = await generateCharts(marketData);
  } catch (err) {
    logger.warn(`Chart generation failed, continuing without: ${err}`);
  }

  // Embed charts into article content
  if (charts.equityChartUrl) {
    const chartSection = `
<div>
  <img src="${charts.equityChartUrl}" alt="Global Equity Markets Daily % Change" style="max-width:100%;height:auto;" />
  <img src="${charts.fxChartUrl}" alt="FX Rates Daily % Change" style="max-width:100%;height:auto;" />
  <img src="${charts.commodityChartUrl}" alt="Commodities and Crypto Daily % Change" style="max-width:100%;height:auto;" />
</div>`;
    article = { ...article, content: article.content + chartSection };
  }

  // Agent 6: SEO (required)
  let seo;
  try {
    seo = await generateSeo(article.title, article.summary, date);
  } catch (err) {
    const error = `SEO generation failed: ${err}`;
    logger.error(error);
    return { success: false, error, duration: Date.now() - startTime };
  }

  // Agent 7: Quality check (warning only)
  try {
    const quality = await qualityCheck(article.content, article.title);
    if (!quality.passed || quality.score < 60) {
      logger.warn(
        `Quality check warning — score: ${quality.score}, passed: ${quality.passed}, issues: ${quality.issues.join('; ')}`,
      );
    } else {
      logger.info(`Quality check passed — score: ${quality.score}`);
    }
  } catch (err) {
    logger.warn(`Quality check failed, continuing: ${err}`);
  }

  // Agent 8: Upload draft (required)
  let postId: string;
  let editUrl: string;
  try {
    ({ postId, editUrl } = await uploadDraft(article, seo, charts));
  } catch (err) {
    const error = `CMS upload failed: ${err}`;
    logger.error(error);
    return { success: false, error, duration: Date.now() - startTime };
  }

  // Agent 9: Email notification (best-effort)
  try {
    await sendNotification(article.title, article.summary, editUrl, dateLong);
  } catch (err) {
    logger.warn(`Email notification failed (non-fatal): ${err}`);
  }

  const duration = Date.now() - startTime;
  logger.info(`Weekly briefing complete in ${(duration / 1000).toFixed(1)}s — post: ${editUrl}`);

  return {
    success: true,
    postId,
    editUrl,
    title: article.title,
    duration,
  };
}

runWeeklyBriefing()
  .then((result) => {
    if (result.success) {
      logger.info(`Pipeline succeeded: ${result.editUrl}`);
      process.exit(0);
    } else {
      logger.error(`Pipeline failed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((err) => {
    logger.error(`Unhandled pipeline error: ${err}`);
    process.exit(1);
  });
