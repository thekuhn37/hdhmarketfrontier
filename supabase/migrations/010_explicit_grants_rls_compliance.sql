-- =============================================================================
-- 010_explicit_grants_rls_compliance.sql
-- HDH Market Frontier — Supabase Data API explicit GRANT compliance
--
-- Context:
--   Starting May 30 2026, new Supabase projects require explicit GRANTs on
--   public-schema tables for the Data API (PostgREST / supabase-js) to reach
--   them. Existing projects must comply by October 30 2026.
--
-- What this migration does:
--   1. Explicitly GRANTs the minimum necessary privileges to the `anon` and
--      `authenticated` roles for every public-schema table.
--   2. Uses column-level grants on `profiles` so anonymous users cannot read
--      private fields (email, consents, professional details).
--   3. Fixes the post_translations write policy (auth.role()='service_role'
--      is never evaluated because service_role bypasses RLS entirely).
--   4. Adds a forward-looking template comment for future migrations.
--
-- Access model (summary):
--   anon         → read-only on published/public data; can INSERT tracking rows
--   authenticated → read + limited write; RLS policies further restrict
--   service_role  → bypasses RLS; used only by server-side code / GitHub Actions
-- =============================================================================


-- =============================================================================
-- SECTION 1: profiles
-- =============================================================================
-- anon: read-only, safe columns only (no email / consent / professional data)
-- authenticated: full SELECT (RLS "self update" and "admin all" govern writes)

REVOKE SELECT ON TABLE public.profiles FROM anon;

GRANT SELECT (
  id,
  display_name,
  avatar_url,
  role,
  created_at
) ON TABLE public.profiles TO anon;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;


-- =============================================================================
-- SECTION 2: posts
-- =============================================================================
-- anon: SELECT only (RLS filters to status = 'published')
-- authenticated: full DML (RLS blocks non-admin writes)

GRANT SELECT                          ON TABLE public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON TABLE public.posts TO authenticated;


-- =============================================================================
-- SECTION 3: tags
-- =============================================================================
-- Public navigation data — anon and authenticated can read.
-- Writes are admin-only via RLS.

GRANT SELECT                          ON TABLE public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON TABLE public.tags TO authenticated;


-- =============================================================================
-- SECTION 4: post_tags
-- =============================================================================
-- Join table for post ↔ tag relationships — same read/write model as tags.

GRANT SELECT                ON TABLE public.post_tags TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.post_tags TO authenticated;


-- =============================================================================
-- SECTION 5: comments
-- =============================================================================
-- anon: SELECT only (RLS filters to status = 'approved' and is_private = false)
-- authenticated: full DML (RLS: own inserts; own update/delete; admin all)

GRANT SELECT                          ON TABLE public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON TABLE public.comments TO authenticated;


-- =============================================================================
-- SECTION 6: contact_messages
-- =============================================================================
-- anon and authenticated: INSERT only (public contact form)
-- SELECT / UPDATE / DELETE: admin only via RLS

GRANT INSERT ON TABLE public.contact_messages TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.contact_messages TO authenticated;


-- =============================================================================
-- SECTION 7: page_views
-- =============================================================================
-- Anonymous analytics collection — insert-only for public roles.
-- Reads are admin-only via RLS.

GRANT INSERT ON TABLE public.page_views TO anon;
GRANT INSERT ON TABLE public.page_views TO authenticated;


-- =============================================================================
-- SECTION 8: post_views
-- =============================================================================
-- Same model as page_views.

GRANT INSERT ON TABLE public.post_views TO anon;
GRANT INSERT ON TABLE public.post_views TO authenticated;


-- =============================================================================
-- SECTION 9: ai_drafts
-- =============================================================================
-- Internal admin tool — no anon access.
-- Authenticated GRANT exists so the admin dashboard (authenticated session) can
-- reach the table; the RLS "admin all" policy blocks non-admin users.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_drafts TO authenticated;


-- =============================================================================
-- SECTION 10: cookie_consents
-- =============================================================================
-- Public INSERT for consent recording; SELECT for own record only (via RLS).

GRANT SELECT, INSERT         ON TABLE public.cookie_consents TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.cookie_consents TO authenticated;


-- =============================================================================
-- SECTION 11: post_translations
-- =============================================================================
-- anon + authenticated: SELECT only (cached AI translations, always public once stored)
-- Writes come exclusively from server-side service_role (bypasses RLS) so no
-- authenticated write grant is needed here.

GRANT SELECT ON TABLE public.post_translations TO anon;
GRANT SELECT ON TABLE public.post_translations TO authenticated;

-- Fix: the original policy "Service role manages post_translations" used
-- auth.role() = 'service_role', which is NEVER evaluated because the service
-- role key bypasses RLS entirely. Drop it and replace with an explicit admin
-- policy so the admin dashboard can also manage translations if needed.

DROP POLICY IF EXISTS "Service role manages post_translations" ON public.post_translations;

CREATE POLICY "post_translations: admin manage"
  ON public.post_translations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- =============================================================================
-- SECTION 12: comments — add RLS policy covering is_private column
--   (added by migration 008, but the SELECT policy was not updated)
-- =============================================================================

DROP POLICY IF EXISTS "comments: public read approved" ON public.comments;

CREATE POLICY "comments: public read approved"
  ON public.comments
  FOR SELECT
  USING (status = 'approved' AND (is_private = false OR is_private IS NULL));


-- =============================================================================
-- VERIFICATION QUERIES (run manually to confirm after applying)
-- =============================================================================
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
-- ORDER BY table_name, grantee, privilege_type;

-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;


-- =============================================================================
-- MIGRATION TEMPLATE FOR FUTURE TABLES
-- =============================================================================
-- Copy this block when creating a new public-schema table:
--
-- CREATE TABLE public.<table_name> (
--   id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
--   ...
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
--
-- -- 1. Indexes
-- CREATE INDEX idx_<table_name>_... ON public.<table_name> (...);
--
-- -- 2. Explicit GRANTs (add only what is needed; default to least privilege)
-- GRANT SELECT ON TABLE public.<table_name> TO anon;                          -- if public read needed
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO authenticated; -- if authenticated write needed
--
-- -- 3. Enable RLS
-- ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
--
-- -- 4. Policies
-- CREATE POLICY "<table_name>: public read"
--   ON public.<table_name> FOR SELECT
--   USING (<condition for public visibility>);
--
-- CREATE POLICY "<table_name>: admin all"
--   ON public.<table_name> FOR ALL
--   USING (
--     EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
--   )
--   WITH CHECK (
--     EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
--   );
--
-- -- 5. Column comment documenting intended access
-- COMMENT ON TABLE public.<table_name> IS
--   'Access: anon=SELECT, authenticated=SELECT+INSERT, service_role=all (bypasses RLS)';
