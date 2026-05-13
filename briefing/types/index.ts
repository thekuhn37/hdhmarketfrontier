export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  direction: 'up' | 'down' | 'flat';
}

export interface MarketData {
  timestamp: string;
  equities: {
    us: {
      sp500: MarketQuote;
      nasdaq: MarketQuote;
      dow: MarketQuote;
      russell2000: MarketQuote;
      vix: MarketQuote;
    };
    korea: {
      kospi: MarketQuote;
      kosdaq: MarketQuote;
    };
    hongkong: {
      hsi: MarketQuote;
    };
    japan: {
      nikkei: MarketQuote;
    };
    uk: {
      ftse: MarketQuote;
    };
    singapore: {
      sti: MarketQuote;
    };
    australia: {
      asx200: MarketQuote;
    };
  };
  futures: {
    sp: MarketQuote;
    nasdaq: MarketQuote;
    dow: MarketQuote;
  };
  yields: {
    us10y: MarketQuote;
    us2y: MarketQuote;
  };
  fx: {
    dxy: MarketQuote;
    eurusd: MarketQuote;
    usdjpy: MarketQuote;
    usdkrw: MarketQuote;
    gbpusd: MarketQuote;
    usdcnh: MarketQuote;
  };
  commodities: {
    gold: MarketQuote;
    silver: MarketQuote;
    brent: MarketQuote;
    wti: MarketQuote;
    natgas: MarketQuote;
  };
  crypto: {
    btc: MarketQuote;
    eth: MarketQuote;
  };
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt?: string;
}

export interface CalendarEvent {
  date: string;
  event: string;
  importance: string;
  country?: string;
}

export interface ArticleContent {
  title: string;
  content: string;
  summary: string;
}

export interface SeoData {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  tags: string[];
}

export interface ChartData {
  equityChartUrl: string;
  fxChartUrl: string;
  commodityChartUrl: string;
}

export interface QualityCheckResult {
  passed: boolean;
  issues: string[];
  score: number;
}

export interface BriefingPipeline {
  date: string;
  marketData: MarketData;
  news: NewsItem[];
  calendar: CalendarEvent[];
}

export interface BriefingResult {
  success: boolean;
  postId?: string;
  editUrl?: string;
  title?: string;
  error?: string;
  duration?: number;
}
