-- =============================================================================
-- 006_fix_signup_trigger.sql
-- Fix: handle_new_user used new.app_metadata which is not a column on auth.users
--      (correct column is raw_app_meta_data). This caused every signup to 500.
-- Fix: replace INSERT policy with a simpler, guaranteed-to-work check.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix handle_new_user: use raw_app_meta_data instead of app_metadata
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
    COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    CASE WHEN new.email = 'harryhwang37@gmail.com' THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ---------------------------------------------------------------------------
-- 2. Replace INSERT policy with a simpler, reliable check:
--    • Trigger (SECURITY DEFINER, OWNER = postgres): current_user = 'postgres' → allowed
--    • Authenticated user inserting their own row: auth.uid() = id → allowed
--    • Anonymous / fake inserts: neither condition true → denied
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: insert for auth users" ON public.profiles;
CREATE POLICY "profiles: insert for auth users"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR current_user = 'postgres');

-- ---------------------------------------------------------------------------
-- 3. Reload PostgREST schema cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
