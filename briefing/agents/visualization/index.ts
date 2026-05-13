import type { MarketData, ChartData } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

const QUICKCHART_BASE = 'https://quickchart.io/chart';

const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRID_COLOR = 'rgba(255,255,255,0.1)';

function barColor(pct: number): string {
  return pct >= 0 ? '#22C55E' : '#EF4444';
}

function buildChartUrl(config: object): string {
  return `${QUICKCHART_BASE}?c=${encodeURIComponent(JSON.stringify(config))}&width=600&height=300`;
}

function chartBase(labels: string[], data: number[], title: string) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          backgroundColor: data.map(barColor),
          borderColor: data.map(barColor),
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          color: WHITE,
          font: { size: 14 },
        },
      },
      scales: {
        x: {
          ticks: { color: WHITE, font: { size: 10 } },
          grid: { color: GRID_COLOR },
        },
        y: {
          ticks: { color: WHITE, font: { size: 10 } },
          grid: { color: GRID_COLOR },
        },
      },
      backgroundColor: DARK_BG,
    },
  };
}

export async function generateCharts(data: MarketData): Promise<ChartData> {
  logger.info('Generating chart URLs...');

  const equityLabels = ['S&P 500', 'Nasdaq', 'Dow', 'KOSPI', 'Nikkei', 'FTSE', 'Hang Seng', 'ASX 200'];
  const equityData = [
    data.equities.us.sp500.changePct,
    data.equities.us.nasdaq.changePct,
    data.equities.us.dow.changePct,
    data.equities.korea.kospi.changePct,
    data.equities.japan.nikkei.changePct,
    data.equities.uk.ftse.changePct,
    data.equities.hongkong.hsi.changePct,
    data.equities.australia.asx200.changePct,
  ];

  const fxLabels = ['DXY', 'EUR/USD', 'USD/JPY', 'USD/KRW', 'GBP/USD'];
  const fxData = [
    data.fx.dxy.changePct,
    data.fx.eurusd.changePct,
    data.fx.usdjpy.changePct,
    data.fx.usdkrw.changePct,
    data.fx.gbpusd.changePct,
  ];

  const commodityLabels = ['Gold', 'Silver', 'Brent', 'WTI', 'Nat Gas', 'BTC'];
  const commodityData = [
    data.commodities.gold.changePct,
    data.commodities.silver.changePct,
    data.commodities.brent.changePct,
    data.commodities.wti.changePct,
    data.commodities.natgas.changePct,
    data.crypto.btc.changePct,
  ];

  const equityChartUrl = buildChartUrl(chartBase(equityLabels, equityData, 'Global Equities — Daily % Change'));
  const fxChartUrl = buildChartUrl(chartBase(fxLabels, fxData, 'FX Rates — Daily % Change'));
  const commodityChartUrl = buildChartUrl(chartBase(commodityLabels, commodityData, 'Commodities & Crypto — Daily % Change'));

  logger.info('Chart URLs generated.');

  return { equityChartUrl, fxChartUrl, commodityChartUrl };
}
