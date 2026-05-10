# HDH Market Frontier

A professional insight platform by Harry D. Hwang, exploring financial markets, market data, infrastructure, AI, and digital assets from a global and strategic perspective.

**Site:** hdhmarketfrontier.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`) |
| Animation | Framer Motion v12 |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (thumbnail uploads) |
| i18n | next-intl v4 (EN / KO / ZH) |
| AI | OpenAI GPT-4o-mini (summaries, field generation, translation) |
| Email | Resend |
| Deployment | Google Cloud Run (Docker, `output: standalone`) |

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <repo>
cd hdhmarketfrontier
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. Minimum required for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional — unlocks AI features:

```env
OPENAI_API_KEY=sk-...
```

Optional — unlocks contact form email sending:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=contact@hdhmarketfrontier.com
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql   ← all tables + RLS
   supabase/migrations/002_seed_data.sql        ← sample posts & tags
   supabase/migrations/003_post_translations.sql← AI translation cache
   ```
3. Go to **Storage** and create a public bucket named **`thumbnails`**
4. Go to **Authentication > Providers** and enable:
   - Email (enabled by default)
   - Google OAuth (for "Continue with Google")

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects automatically to `/en`.

> **No Supabase?** The site works without any Supabase configuration. All pages have hardcoded fallback data so you can browse the full UI locally.

---

## How to Create an Admin User

1. Sign up at `/en/signup`
2. Confirm your email
3. In the Supabase Dashboard → **Table Editor → profiles**, find your user row and set `role` to `admin`

Or via SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

Once your account is `admin`, a **Dashboard** link appears in the header user-menu dropdown. The admin area is never linked publicly.

---

## Admin Features

Navigate to `/en/admin` after logging in as admin.

### Writing Posts

1. Admin → **Posts** → **New Post**
2. Fill in title, category, language, and content (Markdown/HTML supported)
3. Use **AI buttons** next to each field to generate with GPT-4o-mini:
   - **✨ Generate with AI** on Title → suggests a compelling title from your content
   - **✨ Generate with AI** on Slug → generates a clean URL slug
   - **✨ Generate All with AI** in SEO Settings → fills SEO title + meta description in one click
   - Individual **✨ Generate** buttons on each SEO field
   - **✨ Generate Summary** button above the summary textarea
4. Upload a **thumbnail image** by dragging & dropping or clicking the upload zone (uploads to Supabase Storage, max 5 MB). Or paste an image URL directly.
5. SEO fields auto-fill from the title and summary as you type. Once you manually edit them, auto-fill stops — use **↺ Reset to auto-fill** to revert.
6. Click **Save Draft** or **Publish**

### Other Admin Sections

| Section | Function |
|---|---|
| Dashboard | Stats overview + recent contact messages + top posts by views |
| Posts | List, filter, and manage all posts |
| Comments | Moderate reader comments (approve / hide / delete) |
| Contact Messages | View form submissions, reply via mailto |
| AI Drafts | View AI-generated draft posts awaiting review |

---

## Multilingual Support

The site supports **English** (default), **Korean**, and **Simplified Chinese**.

- Language switcher in the top-right header
- URL structure: `/en/…`, `/ko/…`, `/zh/…`
- UI strings in `messages/en.json`, `messages/ko.json`, `messages/zh.json`

### Post Language & Translation

Each post is written in one language (set in the editor). When a visitor switches language:

- **Home page / category pages** show only posts tagged with that language
- **Post detail pages** automatically translate the full content:
  - Checks the `post_translations` table for a cached translation first (instant)
  - If none exists and `OPENAI_API_KEY` is set: translates via GPT-4o-mini, caches the result
  - First-time translation takes ~2–3 seconds; all subsequent visits use the cache
  - Without an OpenAI key: shows the original with a notice
  - Translated pages show a blue **"AI Translated"** badge and a link back to the original

You can also manually create translations by writing the same post in multiple languages and linking them with a shared `translation_group_id`.

---

## Project Structure

```
app/
  [locale]/                    # Locale-prefixed routes (en / ko / zh)
    page.tsx                   # Home page
    about/                     # About Harry D. Hwang
    markets/                   # Markets category
    data/                      # Data category
    infrastructure/            # Infrastructure category
    ai/                        # AI category
    digital-assets/            # Digital Assets category
    contact/                   # Contact form
    search/                    # Full-text search
    posts/[slug]/              # Post detail (with AI translation)
    login/                     # Login (email + Google OAuth)
    signup/                    # Sign up
    profile/                   # User profile
    admin/                     # Admin dashboard (role-protected)
      posts/                   # Post list
      posts/new/               # Post editor (with AI + image upload)
      comments/                # Comment moderation
      contact-messages/        # Contact form inbox
      ai-drafts/               # AI-generated drafts
    privacy-policy/
    cookie-policy/
    terms-of-use/
  api/
    auth/callback/             # OAuth callback
    auth/logout/               # Logout handler
    contact/                   # Contact form (rate-limited, Resend)
    ai/generate-summary/       # AI summary from content
    ai/generate-fields/        # AI title, slug, SEO from content
  globals.css                  # Tailwind v4 @theme, design tokens, animations
  robots.ts                    # robots.txt
  sitemap.ts                   # sitemap.xml (all routes × 3 locales)

components/
  layout/                      # Header, Footer
  hero/                        # HeroSection, HeroAnimation (canvas)
  home/                        # Landing page sections
  posts/                       # PostCard, CategoryPageLayout
  forms/                       # ContactForm
  search/                      # SearchClient
  admin/                       # AdminLayout (sidebar)
  ui/                          # CookieBanner

lib/
  supabase/
    client.ts                  # Browser Supabase client
    server.ts                  # Server Supabase client + admin client
    types.ts                   # TypeScript types + Database schema
  utils/
    cn.ts                      # Tailwind class merging
    format.ts                  # Date, number, slug formatting
    reading-time.ts            # Reading time calculation
  ai/
    summary.ts                 # Extractive summary + AI summary (OpenAI)
    translate.ts               # Post translation (OpenAI, with DB cache)

messages/
  en.json                      # English UI strings
  ko.json                      # Korean UI strings
  zh.json                      # Simplified Chinese UI strings

i18n/
  routing.ts                   # defineRouting (locales, defaultLocale)
  navigation.ts                # createNavigation helpers (Link, useRouter…)
  request.ts                   # getRequestConfig (server-side)

supabase/
  migrations/
    001_initial_schema.sql     # 10 tables, indexes, RLS, triggers
    002_seed_data.sql          # Sample posts + tags
    003_post_translations.sql  # AI translation cache table
```

---

## Database Schema

10 core tables, all with Row Level Security enabled:

| Table | Purpose |
|---|---|
| `profiles` | User accounts (extends Supabase auth) |
| `posts` | Blog posts with multilingual support |
| `tags` | Post tags |
| `post_tags` | Post ↔ tag join |
| `post_translations` | AI-generated translation cache (post × locale) |
| `comments` | Reader comments with moderation status |
| `contact_messages` | Contact form submissions |
| `page_views` | Anonymous page view tracking |
| `post_views` | Per-post view tracking |
| `ai_drafts` | AI-generated draft posts awaiting review |
| `cookie_consents` | GDPR cookie consent records |

---

## Security

- **Row Level Security** enabled on all tables
- **Admin routes** verify `profiles.role = 'admin'` on every request server-side
- **Contact form** rate-limited to 3 submissions per IP per hour
- **Environment variables** never committed (see `.env.example`)
- **Translation writes** use the service-role key server-side only
- **Thumbnail uploads** validated for file type and size (max 5 MB) before Supabase Storage upload
- For production: recommend Cloudflare or Google Cloud Armor for WAF and DDoS protection

---

## Deployment: Google Cloud Run

### Build and push Docker image

```bash
docker build -t hdhmarketfrontier .
docker tag hdhmarketfrontier gcr.io/YOUR_PROJECT_ID/hdhmarketfrontier
docker push gcr.io/YOUR_PROJECT_ID/hdhmarketfrontier
```

### Deploy

```bash
gcloud run deploy hdhmarketfrontier \
  --image gcr.io/YOUR_PROJECT_ID/hdhmarketfrontier \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...,SUPABASE_SERVICE_ROLE_KEY=...,OPENAI_API_KEY=..." \
  --memory 512Mi \
  --cpu 1
```

### Pre-deployment checklist

- [ ] Run all 3 migrations in Supabase SQL Editor
- [ ] Create `thumbnails` bucket in Supabase Storage (set to public)
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Set `OPENAI_API_KEY` for AI features (translation, field generation, summaries)
- [ ] Set `RESEND_API_KEY` for contact form email delivery
- [ ] Create admin user and set `role = 'admin'` in profiles table
- [ ] Map custom domain `hdhmarketfrontier.com` in Cloud Run
- [ ] (Optional) Add Cloudflare in front for CDN + WAF

---

## Future Enhancements

- [ ] Rich text editor (TipTap) to replace the Markdown textarea
- [ ] Full-text search via Supabase `to_tsvector` / `websearch_to_tsquery`
- [ ] Comments section on post pages (moderated)
- [ ] Email newsletter integration
- [ ] AI market brief automation (scheduled job: Yahoo Finance data → GPT → draft)
- [ ] Analytics dashboard with charts (page views over time, top posts)
- [ ] Reading progress indicator on post pages
- [ ] Dark mode
- [ ] LinkedIn OAuth (configure in Supabase once available)
- [ ] Multi-author support

---

## License

© 2025 Harry D. Hwang. All rights reserved.
