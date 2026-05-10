-- Post translations cache
-- Stores AI-translated versions of posts so they are only generated once per locale

CREATE TABLE IF NOT EXISTS post_translations (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale      text        NOT NULL CHECK (locale IN ('en', 'ko', 'zh')),
  title       text        NOT NULL,
  summary     text,
  content     text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(post_id, locale)
);

ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached translations
CREATE POLICY "Public read post_translations"
  ON post_translations FOR SELECT USING (true);

-- Only service role (server) can write translations
CREATE POLICY "Service role manages post_translations"
  ON post_translations FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX post_translations_post_locale ON post_translations(post_id, locale);
