-- =============================================================================
-- 001_initial_schema.sql
-- HDH Market Frontier — initial database schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  email           text        not null,
  display_name    text,
  avatar_url      text,
  role            text        not null default 'user',
  provider        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Public: anyone can see basic profile info (needed for post author display)
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Authenticated user can update their own profile
create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can manage all profiles
create policy "profiles: admin all"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 2. posts
-- ---------------------------------------------------------------------------
create table public.posts (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  slug                text        not null unique,
  summary             text,
  content             text,
  thumbnail_url       text,
  category            text        not null,
  language            text        not null default 'en',
  translation_group_id uuid,
  status              text        not null default 'draft',
  author_id           uuid        references public.profiles(id) on delete set null,
  source_url          text,
  seo_title           text,
  seo_description     text,
  og_image_url        text,
  reading_time        int         not null default 0,
  view_count          int         not null default 0,
  is_featured         boolean     not null default false,
  is_popular          boolean     not null default false,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_posts_slug       on public.posts (slug);
create index idx_posts_category   on public.posts (category);
create index idx_posts_status     on public.posts (status);
create index idx_posts_language   on public.posts (language);
create index idx_posts_author_id  on public.posts (author_id);
create index idx_posts_published_at on public.posts (published_at desc);
create index idx_posts_is_featured on public.posts (is_featured) where is_featured = true;
create index idx_posts_is_popular  on public.posts (is_popular)  where is_popular  = true;

create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

-- Public: read published posts
create policy "posts: public read published"
  on public.posts for select
  using (status = 'published');

-- Admins: full access
create policy "posts: admin all"
  on public.posts for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 3. tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

create index idx_tags_slug on public.tags (slug);

alter table public.tags enable row level security;

-- Public: read all tags
create policy "tags: public read"
  on public.tags for select
  using (true);

-- Admins: manage tags
create policy "tags: admin all"
  on public.tags for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 4. post_tags
-- ---------------------------------------------------------------------------
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);

create index idx_post_tags_post_id on public.post_tags (post_id);
create index idx_post_tags_tag_id  on public.post_tags (tag_id);

alter table public.post_tags enable row level security;

create policy "post_tags: public read"
  on public.post_tags for select
  using (true);

create policy "post_tags: admin all"
  on public.post_tags for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 5. comments
-- ---------------------------------------------------------------------------
create table public.comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  content    text        not null,
  status     text        not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comments_post_id on public.comments (post_id);
create index idx_comments_user_id on public.comments (user_id);
create index idx_comments_status  on public.comments (status);

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

-- Public: read approved comments
create policy "comments: public read approved"
  on public.comments for select
  using (status = 'approved');

-- Authenticated: create comments
create policy "comments: authenticated insert"
  on public.comments for insert
  with check (auth.uid() is not null);

-- Users: update/delete their own comments (while pending)
create policy "comments: self update"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "comments: self delete"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Admins: full access
create policy "comments: admin all"
  on public.comments for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 6. contact_messages
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  email        text        not null,
  organization text,
  subject      text        not null,
  message      text        not null,
  status       text        not null default 'unread',
  created_at   timestamptz not null default now()
);

create index idx_contact_messages_status on public.contact_messages (status);

alter table public.contact_messages enable row level security;

-- Public: submit contact form
create policy "contact_messages: public insert"
  on public.contact_messages for insert
  with check (true);

-- Only admins can read contact messages
create policy "contact_messages: admin read"
  on public.contact_messages for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins: full management
create policy "contact_messages: admin all"
  on public.contact_messages for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 7. page_views
-- ---------------------------------------------------------------------------
create table public.page_views (
  id         uuid        primary key default gen_random_uuid(),
  path       text        not null,
  user_id    uuid        references public.profiles(id) on delete set null,
  session_id text,
  referrer   text,
  user_agent text,
  language   text,
  created_at timestamptz not null default now()
);

create index idx_page_views_path       on public.page_views (path);
create index idx_page_views_created_at on public.page_views (created_at desc);
create index idx_page_views_user_id    on public.page_views (user_id);

alter table public.page_views enable row level security;

-- Public: insert page views (anonymous analytics)
create policy "page_views: public insert"
  on public.page_views for insert
  with check (true);

-- Admins: read analytics
create policy "page_views: admin read"
  on public.page_views for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 8. post_views
-- ---------------------------------------------------------------------------
create table public.post_views (
  id               uuid        primary key default gen_random_uuid(),
  post_id          uuid        not null references public.posts(id) on delete cascade,
  user_id          uuid        references public.profiles(id) on delete set null,
  session_id       text,
  referrer         text,
  duration_seconds int,
  created_at       timestamptz not null default now()
);

create index idx_post_views_post_id    on public.post_views (post_id);
create index idx_post_views_user_id    on public.post_views (user_id);
create index idx_post_views_created_at on public.post_views (created_at desc);

alter table public.post_views enable row level security;

-- Public: insert post views
create policy "post_views: public insert"
  on public.post_views for insert
  with check (true);

-- Admins: read post view analytics
create policy "post_views: admin read"
  on public.post_views for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 9. ai_drafts
-- ---------------------------------------------------------------------------
create table public.ai_drafts (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  source_type         text        not null,
  source_url          text,
  raw_data            jsonb,
  generated_summary   text,
  generated_content   text,
  status              text        not null default 'draft',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_ai_drafts_status on public.ai_drafts (status);

create trigger trg_ai_drafts_updated_at
  before update on public.ai_drafts
  for each row execute function public.set_updated_at();

alter table public.ai_drafts enable row level security;

-- Admins: full access
create policy "ai_drafts: admin all"
  on public.ai_drafts for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- 10. cookie_consents
-- ---------------------------------------------------------------------------
create table public.cookie_consents (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references public.profiles(id) on delete set null,
  session_id text,
  essential  boolean     not null default true,
  analytics  boolean     not null default false,
  functional boolean     not null default false,
  created_at timestamptz not null default now()
);

create index idx_cookie_consents_user_id    on public.cookie_consents (user_id);
create index idx_cookie_consents_session_id on public.cookie_consents (session_id);

alter table public.cookie_consents enable row level security;

-- Public: record consent choices
create policy "cookie_consents: public insert"
  on public.cookie_consents for insert
  with check (true);

-- Users can read their own consent record
create policy "cookie_consents: self read"
  on public.cookie_consents for select
  using (
    (user_id is not null and auth.uid() = user_id)
    or session_id is not null
  );

-- Admins: full access
create policy "cookie_consents: admin all"
  on public.cookie_consents for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile row when a new user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.app_metadata->>'provider'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
