-- =============================================================================
-- 011_pioneer_lab.sql
-- HDH Market Frontier — Pioneer Lab tables
--
-- Purpose:
--   Private admin-only career intelligence workspace.
--   Three tables: pioneer_job_posts, pioneer_job_search_runs, pioneer_job_sources.
--
-- Access model:
--   anon         → none (no GRANT, no access)
--   authenticated → admin-only (RLS policy checks profiles.role = 'admin')
--   service_role  → all (bypasses RLS)
-- =============================================================================

CREATE TABLE public.pioneer_job_posts (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name            text        NOT NULL DEFAULT '',
  company_category        text        NOT NULL DEFAULT 'Other',
  position_title          text        NOT NULL DEFAULT '',
  function_type           text        NOT NULL DEFAULT 'Other',
  job_description         text,
  expected_salary         text        DEFAULT 'Not disclosed',
  posted_date             date,
  closing_date            date,
  location                text,
  source_platform         text        DEFAULT 'Other',
  source_link             text,
  remote_type             text,
  seniority_level         text,
  employment_type         text,
  required_skills         text[]      NOT NULL DEFAULT '{}',
  preferred_skills        text[]      NOT NULL DEFAULT '{}',
  ai_relevance_score      numeric,
  ai_relevance_explanation text,
  status                  text        NOT NULL DEFAULT 'new',
  notes                   text,
  raw_content             text,
  raw_metadata            jsonb,
  soft_deleted            boolean     NOT NULL DEFAULT false,
  deleted_at              timestamptz,
  first_discovered_at     timestamptz NOT NULL DEFAULT now(),
  last_checked_at         timestamptz,
  created_by              uuid        REFERENCES public.profiles(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pioneer_job_search_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type      text        NOT NULL DEFAULT 'manual',
  input_type    text        NOT NULL DEFAULT 'paste',
  input_summary text,
  result_count  integer     DEFAULT 0,
  status        text        NOT NULL DEFAULT 'completed',
  error_message text,
  created_by    uuid        REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pioneer_job_sources (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name               text        NOT NULL,
  source_type               text        NOT NULL DEFAULT 'website',
  base_url                  text,
  allowed_collection_method text        DEFAULT 'manual_paste',
  notes                     text,
  is_active                 boolean     NOT NULL DEFAULT true,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pioneer_job_posts_status       ON public.pioneer_job_posts (status);
CREATE INDEX idx_pioneer_job_posts_company      ON public.pioneer_job_posts (company_name);
CREATE INDEX idx_pioneer_job_posts_created_at   ON public.pioneer_job_posts (created_at DESC);
CREATE INDEX idx_pioneer_job_posts_soft_deleted ON public.pioneer_job_posts (soft_deleted);
CREATE INDEX idx_pioneer_job_posts_source_link  ON public.pioneer_job_posts (source_link);

-- GRANTs — authenticated only, no anon access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pioneer_job_posts     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pioneer_job_search_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pioneer_job_sources   TO authenticated;

-- Enable RLS
ALTER TABLE public.pioneer_job_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pioneer_job_search_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pioneer_job_sources     ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "pioneer_job_posts: admin all"
  ON public.pioneer_job_posts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "pioneer_job_search_runs: admin all"
  ON public.pioneer_job_search_runs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "pioneer_job_sources: admin all"
  ON public.pioneer_job_sources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pioneer_job_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pioneer_job_posts_updated_at
  BEFORE UPDATE ON public.pioneer_job_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_pioneer_job_posts_updated_at();

COMMENT ON TABLE public.pioneer_job_posts IS
  'Access: anon=none, authenticated=admin-only via RLS, service_role=all (bypasses RLS)';
COMMENT ON TABLE public.pioneer_job_search_runs IS
  'Access: anon=none, authenticated=admin-only via RLS, service_role=all (bypasses RLS)';
COMMENT ON TABLE public.pioneer_job_sources IS
  'Access: anon=none, authenticated=admin-only via RLS, service_role=all (bypasses RLS)';
