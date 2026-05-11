-- =============================================================================
-- 004_profile_extended.sql
-- Extend profiles table with onboarding / professional profile fields
-- =============================================================================

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
