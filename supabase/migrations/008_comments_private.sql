-- Add is_private flag to comments table
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
