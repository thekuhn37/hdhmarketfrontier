-- Create public thumbnails bucket for post images (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  -- Public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public can read thumbnails'
  ) THEN
    CREATE POLICY "Public can read thumbnails"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'thumbnails');
  END IF;

  -- Admin-only upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can upload thumbnails'
  ) THEN
    CREATE POLICY "Admins can upload thumbnails"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'thumbnails'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;

  -- Admin-only update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can update thumbnails'
  ) THEN
    CREATE POLICY "Admins can update thumbnails"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'thumbnails'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;

  -- Admin-only delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can delete thumbnails'
  ) THEN
    CREATE POLICY "Admins can delete thumbnails"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'thumbnails'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;
