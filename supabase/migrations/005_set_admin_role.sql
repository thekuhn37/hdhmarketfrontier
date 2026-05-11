-- =============================================================================
-- 005_set_admin_role.sql
-- Fixes for: RLS blocking trigger INSERT, self-referential admin policy,
-- admin role assignment, and new-user trigger ownership.
--
-- ROOT CAUSE: In Supabase, postgres does NOT have BYPASSRLS.
-- SECURITY DEFINER trigger functions still respect RLS.
-- There was no INSERT policy on profiles → every signup failed with
-- "Database error saving new user".
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Apply migration 004 columns (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country              text,
  ADD COLUMN IF NOT EXISTS company              text,
  ADD COLUMN IF NOT EXISTS job_title            text,
  ADD COLUMN IF NOT EXISTS industry_types       text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests            text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discovery_source     text,
  ADD COLUMN IF NOT EXISTS privacy_consent      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_consent    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 2. Secure helper: check if a UUID exists in auth.users
--    SECURITY DEFINER + postgres owner = can access auth schema
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_exists(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id);
$$;

ALTER FUNCTION public.user_exists(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.user_exists(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. INSERT policy: allow profile creation only for real auth users
--    • Trigger (fires AFTER INSERT on auth.users): user exists → allowed
--    • Random anonymous insert with fake UUID: not in auth.users → denied
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: insert for auth users" ON public.profiles;
CREATE POLICY "profiles: insert for auth users"
  ON public.profiles FOR INSERT
  WITH CHECK (public.user_exists(id));

-- ---------------------------------------------------------------------------
-- 4. Fix self-referential admin SELECT policy (caused 500 on profile reads)
--    Replace inline EXISTS(SELECT FROM profiles) with a SECURITY DEFINER fn
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "profiles: admin all" ON public.profiles;
CREATE POLICY "profiles: admin all"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. handle_new_user trigger: auto-assign admin role for master admin email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, provider, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.app_metadata->>'provider', new.raw_app_meta_data->>'provider', 'email'),
    CASE WHEN new.email = 'harryhwang37@gmail.com' THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Ensure trigger is attached
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Grant admin role to master admin account (existing row)
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'harryhwang37@gmail.com' AND role <> 'admin';

-- ---------------------------------------------------------------------------
-- 7. Reload PostgREST schema cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
