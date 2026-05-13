# HDH Market Frontier — Project Overview

**Author:** Harry D. Hwang  
**Website:** hdhmarketfrontier.com  
**Purpose:** Professional financial intelligence platform and personal brand

---

## What is HDH Market Frontier?

HDH Market Frontier is a full-stack web platform where Harry publishes original research and analysis on global financial markets, market data infrastructure, AI applications in finance, and digital assets.

It is not a generic blog. It is designed to look and function like a professional institutional publication — closer to Bloomberg Intelligence or Refinitiv Perspectives than a personal website. The visual language, content structure, and feature set are all built to project credibility to financial markets professionals: exchange executives, asset managers, data strategists, fintech engineers, and regulators.

The site publishes across five content verticals:

| Vertical | Focus |
|---|---|
| **Markets** | Market structure, trading, liquidity, global exchanges |
| **Data** | Market data strategy, governance, distribution |
| **Infrastructure** | Financial market infrastructure, connectivity, technology |
| **AI** | AI applications in finance and market operations |
| **Digital Assets** | Tokenization, digital securities, stablecoins |

---

## How it works — the technology

The platform is built entirely from scratch using modern web technologies:

- **Next.js 16** — the application framework (server-rendered, fast, SEO-friendly)
- **Supabase** — the database (PostgreSQL), authentication system, and file storage
- **OpenAI GPT-4o-mini** — used for AI writing assistance, automatic translation, and the weekly briefing
- **Tailwind CSS** — the visual design system, with a custom institutional color palette
- **TipTap** — a rich text editor embedded in the admin dashboard, used to write and edit articles
- **Resend** — email delivery (contact form and automated notifications)
- **GitHub Actions** — automated cloud task runner for the weekly briefing pipeline
- **Google Cloud Run** — the production hosting environment (Docker container)
- **Cloudflare** — DNS, CDN, and security layer

The entire codebase is written in TypeScript and maintained in a private GitHub repository.

### Key platform features

**For readers:**
- Articles in English, Korean, and Chinese — the site auto-translates any article on demand using GPT-4o-mini, then caches the result so future visitors pay no AI cost
- Dark and light mode with a Bloomberg-style dark palette
- Reading progress bar, comment section with reply threads, full-text search
- Mobile-responsive at all screen sizes

**For the admin (Harry):**
- A private admin dashboard to write, edit, and publish articles using a rich text editor with AI-assist buttons
- AI can auto-generate a title, slug, SEO metadata, and article summary from pasted content
- Image upload with drag-and-drop directly into the article body
- Comment moderation interface
- Contact message inbox

**For automation:**
- A fully automated weekly market briefing pipeline (described in detail below)

---

## The Multi-Agent Weekly Briefing System

This is the most technically sophisticated feature of the platform.

Every Monday at 22:00 UTC, a pipeline of **9 AI agents** runs automatically on GitHub's servers — no human intervention required. Within a few minutes, it produces a complete, institutional-quality financial market briefing article, saves it as a draft in the database, and emails Harry a link to review and publish.

### Why "multi-agent"?

The term "multi-agent" refers to a system where multiple independent AI programs (agents), each with a specific job, work in sequence. Each agent receives input, does its task, and passes the result to the next. If an optional agent fails (e.g., a news API is down), the pipeline continues without it. If a required agent fails (e.g., can't connect to market data), the entire pipeline stops and reports the error.

This is different from asking ChatGPT a single question. It is a structured, automated production pipeline — every week.

### The 9 agents, step by step

```
GitHub Actions triggers at Monday 22:00 UTC
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 1 — Market Data Collection           [required]  │
│  Fetches live prices for 27 financial instruments:       │
│  • 12 global equity indices (S&P 500, Nasdaq, KOSPI,    │
│    Nikkei, FTSE, Hang Seng, ASX 200, etc.)              │
│  • US stock index futures (S&P, Nasdaq, Dow)            │
│  • US Treasury yields (2Y, 10Y)                         │
│  • 6 FX pairs (DXY, EUR/USD, USD/JPY, USD/KRW, etc.)   │
│  • 5 commodities (Gold, Silver, Brent, WTI, Nat Gas)    │
│  • Bitcoin and Ethereum                                  │
│  Source: Yahoo Finance v8 chart API + CoinGecko         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 2 — News Collection                  [optional]  │
│  Parses 4 financial news RSS feeds:                     │
│  MarketWatch, Yahoo Finance, CNBC, Reuters               │
│  Extracts recent headlines and summaries                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 3 — Economic Calendar                [optional]  │
│  Fetches upcoming economic events via Finnhub API       │
│  (central bank meetings, CPI releases, jobs data, etc.) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 4 — Article Generation               [required]  │
│  Sends all collected data to GPT-4o-mini with a         │
│  detailed prompt written to match Bloomberg Intelligence │
│  style. GPT writes a full 11-section HTML article:      │
│                                                          │
│  1. Executive Summary                                    │
│  2. Weekly Insights (editorial centerpiece)             │
│  3. Global Equity Markets (with data table)             │
│  4. Futures & Volatility                                │
│  5. FX Markets                                          │
│  6. Commodities                                         │
│  7. Cryptocurrency                                      │
│  8. Regional Highlights (Asia-Pacific / Europe)         │
│  9. Key Market News                                     │
│  10. Economic Calendar Ahead                            │
│  11. Weekly Outlook (forward-looking)                   │
│                                                          │
│  GPT is instructed to only use the exact numbers        │
│  provided — it cannot invent or modify data.            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 5 — Chart Generation                 [optional]  │
│  Builds 3 dark-themed bar charts using QuickChart.io:   │
│  • Global Equity % Change                               │
│  • FX % Change                                          │
│  • Commodities & Crypto % Change                        │
│  Green bars = positive, Red bars = negative             │
│  Charts are hosted by QuickChart and embedded via URL   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 6 — SEO Generation                   [required]  │
│  GPT-4o-mini generates:                                 │
│  • SEO title (≤60 characters)                           │
│  • SEO description (≤160 characters)                    │
│  • URL slug                                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 7 — Quality Check                    [optional]  │
│  GPT scores the article on a 0–100 scale.               │
│  Score < 60 → logs a warning but does not stop pipeline │
│  Score ≥ 60 → logged as passed                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 8 — Database Upload                  [required]  │
│  Saves the complete article to the Supabase database    │
│  as status: "draft" — nothing is published automatically│
│  Harry reviews and publishes manually                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 9 — Email Notification               [optional]  │
│  Sends Harry an HTML email via Resend:                  │
│  "Your Weekly Market Brief is ready for review"         │
│  Includes a direct link to the draft in the admin panel │
└─────────────────────────────────────────────────────────┘
```

### What happens if something goes wrong?

The pipeline is designed for real-world reliability:

- **Optional agents** (news, calendar, charts, quality check, email) are wrapped in `try/catch`. If they fail, the pipeline logs a warning and continues. The article still gets written and saved.
- **Required agents** (market data, article writing, database upload) will stop the pipeline and report the error if they fail.

This means the worst case is: no charts or news in one article. The best case is: a complete, polished briefing with charts, news, economic calendar, and email notification — all produced in about 2 minutes with no human input.

### Cost

Each pipeline run costs approximately **$0.003 in OpenAI API fees** — about 3 US cents per month for weekly runs. The market data (Yahoo Finance, CoinGecko) and chart generation (QuickChart) are free.

---

## What makes this notable

From an engineering standpoint, several aspects of this project are worth highlighting:

**1. Built entirely from scratch**  
No website builder, no template, no low-code platform. Every page, component, API route, database table, and automated pipeline was designed and coded by Harry using Claude as a development assistant.

**2. Multi-agent AI pipeline on a personal project**  
Multi-agent orchestration systems are typically found in enterprise AI products. Deploying one on a personal financial platform — with production-level error handling, cost awareness, and graceful degradation — demonstrates a practical understanding of how AI systems work in real deployments.

**3. AI as a real product feature, not a demo**  
The AI translation system is not a demo. Every article on the site is automatically translated into Korean and Chinese on first view, then cached — so subsequent visitors get instant translation at zero marginal cost. This is the same pattern used by professional multilingual publications.

**4. Institutional-grade database security**  
The database uses Supabase Row Level Security across all 11 tables. Each role (public visitors, authenticated users, admin, server-side processes) has precisely scoped access — down to the column level in some cases (anonymous users cannot read email addresses from the profiles table). The system complies with Supabase's upcoming May 2026 data access policy changes.

**5. Full production architecture**  
The platform is not a side project running on a laptop. It uses a Docker container deployed to Google Cloud Run, a Cloudflare CDN and WAF, a real email domain (`noreply@hdhmarketfrontier.com`), GitHub Actions for automation, and a live PostgreSQL database — the same architecture stack used by professional SaaS companies.

---

## Summary

HDH Market Frontier is a professional financial intelligence platform built by Harry D. Hwang to publish original market analysis and establish credibility in the global financial markets industry.

Its most distinctive technical feature is a **9-agent automated pipeline** that runs every Monday on GitHub's servers, fetches live market data from 27 instruments across global equity, FX, commodity, and crypto markets, passes that data through a chain of specialized AI agents, and produces a complete institutional-quality market briefing — saved as a draft, ready for Harry to review and publish.

The entire platform — from the public-facing website to the admin dashboard to the automated pipeline — was built from scratch in TypeScript, using modern open-source tools and commercial AI APIs.
