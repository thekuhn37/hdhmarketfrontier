-- =============================================================================
-- 002_seed_data.sql
-- HDH Market Frontier — sample tags and posts
--
-- IMPORTANT: The author_id '00000000-0000-0000-0000-000000000000' is a
-- placeholder. After creating the real admin user via Supabase Auth, run:
--
--   update public.posts
--   set author_id = '<real-admin-uuid>'
--   where author_id = '00000000-0000-0000-0000-000000000000';
--
--   update public.profiles
--   set role = 'admin'
--   where id = '<real-admin-uuid>';
--
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
insert into public.tags (id, name, slug) values
  ('11000000-0000-0000-0000-000000000001', 'Market Structure',    'market-structure'),
  ('11000000-0000-0000-0000-000000000002', 'Market Data',         'market-data'),
  ('11000000-0000-0000-0000-000000000003', 'Data Strategy',       'data-strategy'),
  ('11000000-0000-0000-0000-000000000004', 'AI',                  'ai'),
  ('11000000-0000-0000-0000-000000000005', 'Digital Assets',      'digital-assets'),
  ('11000000-0000-0000-0000-000000000006', 'Tokenization',        'tokenization'),
  ('11000000-0000-0000-0000-000000000007', 'Infrastructure',      'infrastructure'),
  ('11000000-0000-0000-0000-000000000008', 'Korea Market',        'korea-market'),
  ('11000000-0000-0000-0000-000000000009', 'Regulation',          'regulation'),
  ('11000000-0000-0000-0000-000000000010', 'Industry Insight',    'industry-insight'),
  ('11000000-0000-0000-0000-000000000011', 'Research',            'research'),
  ('11000000-0000-0000-0000-000000000012', 'Analysis',            'analysis'),
  ('11000000-0000-0000-0000-000000000013', 'Commentary',          'commentary')
on conflict (slug) do nothing;


-- ---------------------------------------------------------------------------
-- Placeholder author profile
-- (Deleted once a real admin user exists — see notes above)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, display_name, role)
values (
  '00000000-0000-0000-0000-000000000000',
  'admin@hdhmarketfrontier.com',
  'Harry D. Hwang',
  'admin'
)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
insert into public.posts (
  id, title, slug, summary, content, category, language,
  status, author_id, reading_time, is_featured, is_popular,
  published_at
) values

-- 1. Markets ---------------------------------------------------------------
(
  '22000000-0000-0000-0000-000000000001',
  'Understanding Market Structure in Modern Exchanges',
  'understanding-market-structure-in-modern-exchanges',
  'Equity market structure has undergone a dramatic transformation over the past two decades. This post explores the key architectural shifts — from floor-based trading to fragmented electronic venues — and what they mean for market participants today.',
  E'Equity market structure has undergone a dramatic transformation over the past two decades. The shift from floor-based, specialist-driven markets to fully electronic, fragmented venues has reshaped how prices are formed, how liquidity is distributed, and how participants compete for order flow. Understanding this evolution is essential for anyone working in trading, market data, or financial infrastructure.\n\nAt the heart of modern market structure lies the concept of fragmentation. In the United States alone, there are more than a dozen lit exchanges and a growing number of alternative trading systems (ATS) and dark pools. This fragmentation was deliberately engineered by Regulation NMS in 2005, which introduced the Order Protection Rule and created a national best bid and offer (NBBO) that exchanges are required to respect. The intent was to promote competition and lower costs for investors — and by many measures, it succeeded. Spreads have compressed dramatically, and the cost of executing a standard retail order is now effectively zero at major brokerages.\n\nYet fragmentation also introduces complexity. Market makers must simultaneously quote across multiple venues, data vendors must aggregate feeds from dozens of sources, and regulators must surveil a landscape where a single trade may touch several systems before settlement. The rise of payment for order flow (PFOF), the debate over the fairness of exchange rebate structures, and ongoing discussions about the consolidated tape in Europe all reflect the unresolved tensions at the core of modern market structure. For capital market professionals, staying informed on these structural dynamics is not optional — it is foundational.',
  'Markets',
  'en',
  'published',
  '00000000-0000-0000-0000-000000000000',
  7,
  true,
  false,
  now() - interval '10 days'
),

-- 2. Data ------------------------------------------------------------------
(
  '22000000-0000-0000-0000-000000000002',
  'Why Market Data Strategy Matters More Than Ever',
  'why-market-data-strategy-matters-more-than-ever',
  'Market data is no longer a back-office cost centre — it is a strategic asset. Firms that treat data as infrastructure and invest in governance, quality, and distribution are outperforming peers who regard it as a commodity subscription.',
  E'Market data is no longer a back-office cost centre — it is a strategic asset that sits at the intersection of trading, technology, and regulatory compliance. Firms that treat data as infrastructure and invest deliberately in governance, quality, and distribution are consistently outperforming peers who regard it as a commodity subscription to be minimised. The difference is not always visible on a P&L, but it compounds over time in the form of faster model iteration, lower data-incident rates, and stronger regulatory confidence.\n\nThe scope of what constitutes "market data" has also expanded significantly. Beyond traditional price and volume feeds, firms now manage reference data, corporate actions, ESG datasets, alternative data, and an ever-growing volume of derived analytics. Each data type carries its own licensing constraints, quality characteristics, and latency requirements. Without a coherent data strategy — one that maps data to use cases, assigns clear ownership, and enforces quality standards — organisations quickly find themselves in a patchwork of siloed systems that are expensive to maintain and difficult to audit.\n\nFor data and technology leaders in financial services, the opportunity is to reframe market data from a cost to be controlled into a capability to be built. This means investing in data catalogues, lineage tools, and API-first distribution patterns. It means negotiating vendor contracts with an eye toward derived data rights and redistribution terms. And it means cultivating internal literacy around data licensing — because a poorly understood licence clause can trigger material financial and reputational exposure. A mature market data strategy is, ultimately, a competitive moat.',
  'Data',
  'en',
  'published',
  '00000000-0000-0000-0000-000000000000',
  6,
  true,
  false,
  now() - interval '7 days'
),

-- 3. Infrastructure --------------------------------------------------------
(
  '22000000-0000-0000-0000-000000000003',
  'The Hidden Infrastructure Behind Financial Markets',
  'the-hidden-infrastructure-behind-financial-markets',
  'Most market participants interact daily with the visible layer of financial markets — exchanges, brokers, and trading platforms. Far fewer think about the financial market infrastructure (FMI) that makes it all work: clearing houses, settlement systems, and trade repositories.',
  E'Most market participants interact daily with the visible layer of financial markets — exchanges, brokers, and trading platforms. Far fewer pause to think about the financial market infrastructure (FMI) that makes it all possible: central counterparties (CCPs), central securities depositories (CSDs), payment systems, and trade repositories. These entities operate largely out of sight, yet a failure in any one of them can cascade across an entire financial system within hours.\n\nClearing houses, in particular, occupy a pivotal role. By interposing themselves between the buyer and seller of every cleared trade, CCPs mutualise counterparty risk and allow markets to function even when individual participants default. The 2008 financial crisis accelerated the push toward central clearing for OTC derivatives, and today the largest CCPs — LCH, CME Clearing, and Eurex Clearing — are systemically important institutions subject to intense supervisory scrutiny. Their default waterfall models, margin methodologies, and stress-testing frameworks are the subject of ongoing global policy debate.\n\nFor professionals building systems that interact with FMI — whether through connectivity to central depositories, messaging via ISO 20022, or compliance with T+1 settlement rules — a working knowledge of how these institutions function is indispensable. The move to shorter settlement cycles, the integration of distributed ledger technology at the settlement layer, and the geopolitical pressures on cross-border FMI links are reshaping the plumbing of global capital markets. The professionals who understand both the business logic and the technical architecture of this infrastructure will be in high demand for years to come.',
  'Infrastructure',
  'en',
  'published',
  '00000000-0000-0000-0000-000000000000',
  8,
  false,
  true,
  now() - interval '5 days'
),

-- 4. AI --------------------------------------------------------------------
(
  '22000000-0000-0000-0000-000000000004',
  'AI Use Cases in Financial Data Governance',
  'ai-use-cases-in-financial-data-governance',
  'Artificial intelligence is transforming how financial institutions manage data quality, lineage, and compliance. From automated metadata tagging to anomaly detection in reference data pipelines, AI is making data governance more scalable — and more reliable.',
  E'Artificial intelligence is quietly transforming how financial institutions manage the quality, lineage, and compliance of their data assets. For years, data governance in financial services was synonymous with manual processes: spreadsheet-based data dictionaries, quarterly data-quality reviews, and compliance checklists completed by hand. The volume and velocity of modern financial data has simply outpaced these approaches, creating pressure to find scalable alternatives.\n\nAI is now being deployed across the data governance lifecycle in concrete, measurable ways. Natural language processing models can scan large volumes of data documentation to automatically suggest metadata tags and business definitions, dramatically accelerating the population of enterprise data catalogues. Machine learning models trained on historical data patterns can detect anomalies in real-time market data feeds — flagging price stale values, missing corporate actions, or sudden reference data inconsistencies before they propagate into downstream systems. Graph-based AI techniques are being used to map and visualise data lineage at a granularity that was previously impractical, making it far easier to answer regulators' questions about data provenance.\n\nThe caveats are real. AI models in governance contexts require careful validation, and the "black box" nature of some approaches sits uneasily with the explainability requirements of financial regulation. There is also a material risk of over-automating decisions that should involve human judgment. Nonetheless, for data management teams facing ever-increasing regulatory demands — BCBS 239, DORA, GDPR — and shrinking headcount budgets, AI-assisted governance is fast becoming not a luxury but a necessity.',
  'AI',
  'en',
  'published',
  '00000000-0000-0000-0000-000000000000',
  7,
  false,
  true,
  now() - interval '3 days'
),

-- 5. Digital Assets --------------------------------------------------------
(
  '22000000-0000-0000-0000-000000000005',
  'Tokenization and the Future of Market Infrastructure',
  'tokenization-and-the-future-of-market-infrastructure',
  'The tokenization of real-world assets — from equities to bonds to private funds — promises to compress settlement times, unlock liquidity in illiquid markets, and reshape the role of traditional financial market infrastructures. But the path from pilot to production is far from straightforward.',
  E'The tokenization of real-world assets — equities, bonds, real estate, private funds — promises to compress settlement times to seconds, unlock liquidity in historically illiquid markets, and fundamentally reshape the role of traditional financial market infrastructures. Leading exchanges, custodians, and central banks are actively piloting tokenisation projects, and several central securities depositories have begun integrating distributed ledger technology into their core settlement workflows. The momentum is unmistakeable.\n\nYet the path from pilot to production at scale is far from straightforward. Tokenisation does not exist in a regulatory vacuum. Securities laws were written for a world of paper certificates and central registers; mapping token ownership onto existing legal frameworks requires careful legal engineering and, in most jurisdictions, new primary legislation or regulatory guidance. The interoperability problem is equally significant — a tokenised bond settled on one chain must be able to interact with tokenised cash on another, and the messaging standards, identity frameworks, and legal certainty required to achieve this are still being constructed.\n\nFor professionals in market structure, data, and infrastructure roles, tokenisation represents both an opportunity and an obligation to engage. The data challenges alone are substantial: on-chain transaction data requires new ingestion and normalisation pipelines; smart contract events must be mapped to existing reporting taxonomies; and the blurring of the line between market data and on-chain state raises novel questions about data licensing and redistribution. The institutions that invest now in understanding the technical architecture — token standards, custody models, atomic settlement — will be far better positioned when tokenised markets reach critical mass.',
  'Digital Assets',
  'en',
  'published',
  '00000000-0000-0000-0000-000000000000',
  8,
  false,
  false,
  now() - interval '1 day'
)

on conflict (slug) do nothing;


-- ---------------------------------------------------------------------------
-- Post ↔ Tag relationships
-- ---------------------------------------------------------------------------
insert into public.post_tags (post_id, tag_id) values
  -- Post 1: Markets
  ('22000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001'), -- Market Structure
  ('22000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000012'), -- Analysis
  ('22000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000010'), -- Industry Insight

  -- Post 2: Data
  ('22000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002'), -- Market Data
  ('22000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000003'), -- Data Strategy
  ('22000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000011'), -- Research

  -- Post 3: Infrastructure
  ('22000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000007'), -- Infrastructure
  ('22000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000012'), -- Analysis
  ('22000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000010'), -- Industry Insight

  -- Post 4: AI
  ('22000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004'), -- AI
  ('22000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000003'), -- Data Strategy
  ('22000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000009'), -- Regulation

  -- Post 5: Digital Assets
  ('22000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000005'), -- Digital Assets
  ('22000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000006'), -- Tokenization
  ('22000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000007')  -- Infrastructure

on conflict do nothing;
