# Supabase Security Checklist — HDH Market Frontier

## Why this exists

Starting **May 30 2026**, new Supabase projects require explicit `GRANT` statements
before the Data API (supabase-js / PostgREST) can reach any table in the `public`
schema. Existing projects must comply by **October 30 2026**.

Migration `010_explicit_grants_rls_compliance.sql` brings this project into compliance.
This document explains the access model and what every developer must do when creating
new tables or writing database queries.

---

## Access roles at a glance

| Role | Who uses it | Bypasses RLS? |
|---|---|---|
| `anon` | Unauthenticated visitors (anon key in browser) | No |
| `authenticated` | Logged-in users (anon key + JWT in browser) | No |
| `service_role` | Server-side code, GitHub Actions, API routes | **Yes — full access** |

**Rule: never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.**
It must only appear in:
- `lib/supabase/server.ts` (`createAdminClient`)
- `briefing/lib/supabaseAdmin.ts`
- `.github/workflows/*.yml` (via GitHub Secrets)
- `app/api/` route handlers

Any variable prefixed with `NEXT_PUBLIC_` is readable by the browser — never name a
service role key with that prefix.

---

## When to use each role

### Use `anon` when
- Displaying published posts to unauthenticated visitors
- Recording page/post views
- Submitting the contact form
- Recording cookie consent

### Use `authenticated` when
- Displaying user profile data to the logged-in user
- Submitting or editing comments
- Admin dashboard operations (combined with RLS admin policy)

### Use `service_role` when
- Writing AI-generated drafts from GitHub Actions (`briefing/` pipeline)
- Upserting post translations (server-side cache writes)
- Any operation that must bypass RLS (bulk imports, admin scripts)
- API routes that perform privileged operations on behalf of users

---

## Table access model

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `profiles` | SELECT (safe columns only) | SELECT + UPDATE | all |
| `posts` | SELECT (published only via RLS) | SELECT + INSERT + UPDATE + DELETE (admin RLS) | all |
| `tags` | SELECT | SELECT + INSERT + UPDATE + DELETE (admin RLS) | all |
| `post_tags` | SELECT | SELECT + INSERT + DELETE (admin RLS) | all |
| `comments` | SELECT (approved, non-private via RLS) | SELECT + INSERT + UPDATE + DELETE (own / admin RLS) | all |
| `contact_messages` | INSERT | INSERT + SELECT + UPDATE + DELETE (admin RLS) | all |
| `page_views` | INSERT | INSERT | all |
| `post_views` | INSERT | INSERT | all |
| `ai_drafts` | none | SELECT + INSERT + UPDATE + DELETE (admin RLS) | all |
| `cookie_consents` | SELECT + INSERT | SELECT + INSERT + UPDATE | all |
| `post_translations` | SELECT | SELECT (writes via service_role only) | all |

---

## Checklist when creating a new table

Copy this pattern into your migration. Do not skip any step.

```sql
-- 1. Create the table
CREATE TABLE public.<name> (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_<name>_... ON public.<name> (...);

-- 3. Explicit GRANTs (minimum required — no extras)
GRANT SELECT ON TABLE public.<name> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<name> TO authenticated;
-- If anon should NOT read this table, omit the anon grant entirely.
-- service_role always has full access (bypasses RLS).

-- 4. Enable RLS — mandatory on every public-schema table
ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;

-- 5. Policies — at minimum, one SELECT and one admin-all
CREATE POLICY "<name>: public read"
  ON public.<name> FOR SELECT
  USING (<condition>);

CREATE POLICY "<name>: admin all"
  ON public.<name> FOR ALL
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

-- 6. Document intended access
COMMENT ON TABLE public.<name> IS
  'Access: anon=SELECT, authenticated=SELECT+INSERT, service_role=all';
```

---

## How to write GRANT statements

```sql
-- Read-only for public visitors
GRANT SELECT ON TABLE public.<name> TO anon;

-- Full DML for authenticated users (RLS policies still apply)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<name> TO authenticated;

-- Column-level grant (hide sensitive fields from anon)
REVOKE SELECT ON TABLE public.<name> FROM anon;
GRANT SELECT (id, display_name, avatar_url) ON TABLE public.<name> TO anon;
```

**Never use `GRANT ALL` to `anon` or `authenticated`.** It grants privileges beyond
SELECT/INSERT/UPDATE/DELETE (e.g. TRUNCATE, REFERENCES) which are not needed.

---

## How to write RLS policies

### Allow public read of published content
```sql
CREATE POLICY "posts: public read published"
  ON public.posts FOR SELECT
  USING (status = 'published');
```

### Allow users to manage only their own rows
```sql
CREATE POLICY "comments: self update"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);
```

### Admin full access
```sql
CREATE POLICY "<table>: admin all"
  ON public.<table> FOR ALL
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
```

---

## Common mistakes to avoid

| Mistake | Why it is dangerous |
|---|---|
| `GRANT ALL ON TABLE ... TO anon` | Gives anon users TRUNCATE and other dangerous ops |
| No RLS on a public-schema table | All data exposed regardless of grants |
| `auth.role() = 'service_role'` in an RLS policy | Service role bypasses RLS entirely — this policy is never evaluated |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | Exposes the service key to the browser |
| Querying drafts via the anon client | Drafts must be filtered server-side with service_role or by checking `status = 'published'` |
| `select('*')` on profiles from client components | Exposes email/consents unless column grants are set |

---

## Testing your policies

Run these queries in the Supabase SQL Editor to verify access:

```sql
-- Check all grants on public-schema tables
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- Check all RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Simulate anon access (should return only published posts)
SET ROLE anon;
SELECT id, title, status FROM public.posts LIMIT 10;
RESET ROLE;

-- Simulate anon access to drafts (should return zero rows)
SET ROLE anon;
SELECT id, title FROM public.posts WHERE status = 'draft';
RESET ROLE;

-- Simulate anon access to ai_drafts (should fail with permission denied)
SET ROLE anon;
SELECT * FROM public.ai_drafts;
RESET ROLE;
```

---

## Supabase May 30 / October 30 2026 compliance

Migration `010_explicit_grants_rls_compliance.sql` covers all existing tables.

For every **new** table created after that migration:
1. Follow the template in Section "Checklist when creating a new table" above.
2. Never create a table and assume the Data API can reach it without a `GRANT`.
3. Always enable RLS immediately after `CREATE TABLE`.
4. Run the verification queries above after every migration.
