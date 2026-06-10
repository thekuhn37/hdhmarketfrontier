-- =============================================================================
-- 002_seed_data.sql
-- HDH Market Frontier — sample tags and placeholder admin profile
--
-- IMPORTANT: The id '00000000-0000-0000-0000-000000000000' is a placeholder
-- admin profile. After creating the real admin user via Supabase Auth, run:
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
