import YahooFinanceClass from 'yahoo-finance2';
const yahooFinance = new (YahooFinanceClass as unknown as new () => { quote: (symbol: string) => Promise<{ regularMarketPrice?: number; regularMarketChange?: number; regularMarketChangePercent?: number }> })();
import type { MarketData, MarketQuote } from '../../types/index.js';
import { withRetry } from '../../utils/retry.js';
import { logger } from '../../utils/logger.js';

const FALLBACK: Omit<MarketQuote, 'symbol' | 'name'> = {
  price: 0,
  change: 0,
  changePct: 0,
  direction: 'flat',
};

function direction(pct: number): 'up' | 'down' | 'flat' {
  if (pct > 0.001) return 'up';
  if (pct < -0.001) return 'down';
  return 'flat';
}

type QuoteMap = Record<string, MarketQuote>;

async function fetchQuotes(symbols: string[], names: Record<string, string>): Promise<QuoteMap> {
  const map: QuoteMap = {};

  for (const symbol of symbols) {
    try {
      const result = await withRetry(
        () => yahooFinance.quote(symbol),
        3,
        1500,
      );
      const price = result.regularMarketPrice ?? 0;
      const change = result.regularMarketChange ?? 0;
      const changePct = (result.regularMarketChangePercent ?? 0);
      map[symbol] = {
        symbol,
        name: names[symbol] ?? symbol,
        price,
        change,
        changePct,
        direction: direction(changePct),
      };
    } catch (err) {
      logger.warn(`Failed to fetch ${symbol}: ${err}`);
      map[symbol] = {
        symbol,
        name: names[symbol] ?? symbol,
        ...FALLBACK,
      };
    }
  }

  return map;
}

interface CoinGeckoResponse {
  bitcoin?: { usd?: number; usd_24h_change?: number };
  ethereum?: { usd?: number; usd_24h_change?: number };
}

async function fetchCrypto(): Promise<{ btc: MarketQuote; eth: MarketQuote }> {
  try {
    const res = await withRetry(
      () =>
        fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
        ).then((r) => r.json() as Promise<CoinGeckoResponse>),
      3,
      1500,
    );

    const btcPrice = res.bitcoin?.usd ?? 0;
    const btcPct = res.bitcoin?.usd_24h_change ?? 0;
    const ethPrice = res.ethereum?.usd ?? 0;
    const ethPct = res.ethereum?.usd_24h_change ?? 0;

    return {
      btc: {
        symbol: 'BTC-USD',
        name: 'Bitcoin',
        price: btcPrice,
        change: (btcPrice * btcPct) / 100,
        changePct: btcPct,
        direction: direction(btcPct),
      },
      eth: {
        symbol: 'ETH-USD',
        name: 'Ethereum',
        price: ethPrice,
        change: (ethPrice * ethPct) / 100,
        changePct: ethPct,
        direction: direction(ethPct),
      },
    };
  } catch (err) {
    logger.warn(`Failed to fetch crypto data: ${err}`);
    return {
      btc: { symbol: 'BTC-USD', name: 'Bitcoin', ...FALLBACK },
      eth: { symbol: 'ETH-USD', name: 'Ethereum', ...FALLBACK },
    };
  }
}

const SYMBOL_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^IXIC': 'Nasdaq Composite',
  '^DJI': 'Dow Jones',
  '^RUT': 'Russell 2000',
  '^VIX': 'VIX',
  '^KS11': 'KOSPI',
  '^KQ11': 'KOSDAQ',
  '^HSI': 'Hang Seng',
  '^N225': 'Nikkei 225',
  '^FTSE': 'FTSE 100',
  '^STI': 'Straits Times Index',
  '^AXJO': 'ASX 200',
  'ES=F': 'S&P 500 Futures',
  'NQ=F': 'Nasdaq Futures',
  'YM=F': 'Dow Futures',
  '^TNX': 'US 10Y Treasury',
  '^FVX': 'US 5Y Treasury',
  'DX-Y.NYB': 'US Dollar Index',
  'EURUSD=X': 'EUR/USD',
  'USDJPY=X': 'USD/JPY',
  'USDKRW=X': 'USD/KRW',
  'GBPUSD=X': 'GBP/USD',
  'USDCNH=X': 'USD/CNH',
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'BZ=F': 'Brent Crude',
  'CL=F': 'WTI Crude',
  'NG=F': 'Natural Gas',
};

export async function collectMarketData(): Promise<MarketData> {
  logger.info('Collecting market data...');

  const allSymbols = Object.keys(SYMBOL_NAMES);
  const q = await fetchQuotes(allSymbols, SYMBOL_NAMES);
  const crypto = await fetchCrypto();

  logger.info('Market data collection complete.');

  return {
    timestamp: new Date().toISOString(),
    equities: {
      us: {
        sp500: q['^GSPC']!,
        nasdaq: q['^IXIC']!,
        dow: q['^DJI']!,
        russell2000: q['^RUT']!,
        vix: q['^VIX']!,
      },
      korea: {
        kospi: q['^KS11']!,
        kosdaq: q['^KQ11']!,
      },
      hongkong: {
        hsi: q['^HSI']!,
      },
      japan: {
        nikkei: q['^N225']!,
      },
      uk: {
        ftse: q['^FTSE']!,
      },
      singapore: {
        sti: q['^STI']!,
      },
      australia: {
        asx200: q['^AXJO']!,
      },
    },
    futures: {
      sp: q['ES=F']!,
      nasdaq: q['NQ=F']!,
      dow: q['YM=F']!,
    },
    yields: {
      us10y: q['^TNX']!,
      us2y: q['^FVX']!,
    },
    fx: {
      dxy: q['DX-Y.NYB']!,
      eurusd: q['EURUSD=X']!,
      usdjpy: q['USDJPY=X']!,
      usdkrw: q['USDKRW=X']!,
      gbpusd: q['GBPUSD=X']!,
      usdcnh: q['USDCNH=X']!,
    },
    commodities: {
      gold: q['GC=F']!,
      silver: q['SI=F']!,
      brent: q['BZ=F']!,
      wti: q['CL=F']!,
      natgas: q['NG=F']!,
    },
    crypto,
  };
}
