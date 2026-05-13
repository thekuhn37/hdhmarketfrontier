import type { BriefingPipeline } from '../types/index.js';
import { formatPct, formatPrice } from '../utils/format.js';

export function buildMarketAnalystPrompt(data: BriefingPipeline): string {
  const { marketData: m, news, calendar, date } = data;

  const equityRows = [
    ['S&P 500', m.equities.us.sp500],
    ['Nasdaq', m.equities.us.nasdaq],
    ['Dow Jones', m.equities.us.dow],
    ['Russell 2000', m.equities.us.russell2000],
    ['VIX', m.equities.us.vix],
    ['KOSPI', m.equities.korea.kospi],
    ['KOSDAQ', m.equities.korea.kosdaq],
    ['Hang Seng', m.equities.hongkong.hsi],
    ['Nikkei 225', m.equities.japan.nikkei],
    ['FTSE 100', m.equities.uk.ftse],
    ['STI', m.equities.singapore.sti],
    ['ASX 200', m.equities.australia.asx200],
  ] as const;

  const equityContext = equityRows
    .map(([name, q]) => `${name}: ${formatPrice(q.price)} (${formatPct(q.changePct)})`)
    .join('\n');

  const futuresContext = [
    `S&P 500 Futures: ${formatPrice(m.futures.sp.price)} (${formatPct(m.futures.sp.changePct)})`,
    `Nasdaq Futures: ${formatPrice(m.futures.nasdaq.price)} (${formatPct(m.futures.nasdaq.changePct)})`,
    `Dow Futures: ${formatPrice(m.futures.dow.price)} (${formatPct(m.futures.dow.changePct)})`,
    `US 10Y Yield: ${formatPrice(m.yields.us10y.price, 3)}% (${formatPct(m.yields.us10y.changePct)})`,
    `US 2Y Yield: ${formatPrice(m.yields.us2y.price, 3)}% (${formatPct(m.yields.us2y.changePct)})`,
  ].join('\n');

  const fxContext = [
    `DXY: ${formatPrice(m.fx.dxy.price)} (${formatPct(m.fx.dxy.changePct)})`,
    `EUR/USD: ${formatPrice(m.fx.eurusd.price, 4)} (${formatPct(m.fx.eurusd.changePct)})`,
    `USD/JPY: ${formatPrice(m.fx.usdjpy.price, 2)} (${formatPct(m.fx.usdjpy.changePct)})`,
    `USD/KRW: ${formatPrice(m.fx.usdkrw.price, 2)} (${formatPct(m.fx.usdkrw.changePct)})`,
    `GBP/USD: ${formatPrice(m.fx.gbpusd.price, 4)} (${formatPct(m.fx.gbpusd.changePct)})`,
    `USD/CNH: ${formatPrice(m.fx.usdcnh.price, 4)} (${formatPct(m.fx.usdcnh.changePct)})`,
  ].join('\n');

  const commodityContext = [
    `Gold: $${formatPrice(m.commodities.gold.price)} (${formatPct(m.commodities.gold.changePct)})`,
    `Silver: $${formatPrice(m.commodities.silver.price)} (${formatPct(m.commodities.silver.changePct)})`,
    `Brent Crude: $${formatPrice(m.commodities.brent.price)} (${formatPct(m.commodities.brent.changePct)})`,
    `WTI Crude: $${formatPrice(m.commodities.wti.price)} (${formatPct(m.commodities.wti.changePct)})`,
    `Natural Gas: $${formatPrice(m.commodities.natgas.price)} (${formatPct(m.commodities.natgas.changePct)})`,
  ].join('\n');

  const cryptoContext = [
    `Bitcoin (BTC): $${formatPrice(m.crypto.btc.price)} (${formatPct(m.crypto.btc.changePct)})`,
    `Ethereum (ETH): $${formatPrice(m.crypto.eth.price)} (${formatPct(m.crypto.eth.changePct)})`,
  ].join('\n');

  const newsContext = news.length
    ? news.map((n, i) => `${i + 1}. [${n.source}] ${n.headline}\n   ${n.summary}`).join('\n\n')
    : 'No news items available.';

  const calendarContext = calendar.length
    ? calendar.map((e) => `${e.date} | ${e.country ?? 'Global'} | ${e.importance} | ${e.event}`).join('\n')
    : 'No calendar events available.';

  const systemPrompt = `You are a senior institutional market analyst writing the daily global market briefing for HDH Market Frontier, a professional financial intelligence platform. Your writing style matches Bloomberg Intelligence: precise, analytical, data-driven, and concise. You never fabricate numbers or data — you only reference what is explicitly provided.`;

  const userPrompt = `Write the full Daily Market Briefing for ${date}. Output ONLY valid HTML — no markdown, no \`\`\`html wrapper, no prose outside HTML tags.

The article must contain EXACTLY these 10 sections as <h2> headings in this order:
1. Executive Summary
2. Global Equity Markets
3. Futures & Volatility
4. FX Markets
5. Commodities
6. Cryptocurrency
7. Regional Highlights
8. Key Market News
9. Economic Calendar
10. Closing Perspective

Section requirements:
- Section 1 (Executive Summary): 2–3 paragraphs synthesizing the overall market narrative for the day. Highlight the dominant theme, key movers, and macro backdrop.
- Section 2 (Global Equity Markets): Include an HTML <table> with columns: Index, Price, Change, % Change, Direction. Use all equity data provided. Add 1–2 paragraphs of analysis after the table.
- Section 3 (Futures & Volatility): Cover ES, NQ, YM futures and the VIX reading. Use the futures and VIX data provided. 1–2 paragraphs.
- Section 4 (FX Markets): Cover DXY, EUR/USD, USD/JPY, USD/KRW, GBP/USD, USD/CNH. Use the FX data provided. 1–2 paragraphs analyzing dollar dynamics and key currency moves.
- Section 5 (Commodities): Cover Gold, Silver, Brent, WTI, Natural Gas. Use commodity data provided. 1–2 paragraphs.
- Section 6 (Cryptocurrency): Cover BTC and ETH. Use crypto data provided. 1 paragraph.
- Section 7 (Regional Highlights): Write a <h3>-subsectioned breakdown for Asia-Pacific (Korea, Japan, Hong Kong, Singapore, Australia) and Europe (UK). Use regional equity data. 2–3 paragraphs total.
- Section 8 (Key Market News): Format as an HTML <ul> with each news item as <li> containing the headline as <strong> followed by the summary. Include source attribution.
- Section 9 (Economic Calendar): Format as an HTML <table> with columns: Date, Country, Importance, Event. Use the calendar events provided. If no events, state that clearly.
- Section 10 (Closing Perspective): 1–2 paragraphs offering a forward-looking perspective on what to watch next session. Reference specific data points from the briefing.

MARKET DATA (use only these numbers — do not invent or modify):

EQUITIES:
${equityContext}

FUTURES & YIELDS:
${futuresContext}

FX:
${fxContext}

COMMODITIES:
${commodityContext}

CRYPTO:
${cryptoContext}

MARKET NEWS:
${newsContext}

ECONOMIC CALENDAR:
${calendarContext}

HTML style guidelines:
- Use <h2> for the 10 section headings, <h3> for subsections within sections
- Use <p> for paragraphs
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tables
- Use <ul>, <li> for news items
- Do NOT include <html>, <head>, <body> tags — output article body content only
- Do NOT use inline styles or class attributes
- Direction arrows: use ▲ for up, ▼ for down, — for flat`;

  return `${systemPrompt}\n\n${userPrompt}`;
}
