# HDH Market Frontier — Project Context & Architecture Reference

> **How to use this file in future Claude sessions**
>
> Before continuing development on this project, read this file first. It contains the canonical record of all architectural decisions, design conventions, security rules, and current implementation status. When starting a new session, reference this document to avoid re-explaining context. When major changes are made, update the relevant sections to keep this document current.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Brand & Design Identity](#2-brand--design-identity)
3. [Technology Stack](#3-technology-stack)
4. [Information Architecture](#4-information-architecture)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Database Architecture](#6-database-architecture)
7. [Translation System](#7-translation-system)
8. [Blog & Post System](#8-blog--post-system)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Analytics & Tracking](#10-analytics--tracking)
11. [Security Rules](#11-security-rules)
12. [Environment Variables](#12-environment-variables)
13. [Deployment Plan](#13-deployment-plan)
14. [Coding Conventions](#14-coding-conventions)
15. [Current Progress Status](#15-current-progress-status)
16. [Priority Roadmap to Professional Blog](#16-priority-roadmap-to-professional-blog)

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Name** | HDH Market Frontier |
| **Domain** | hdhmarketfrontier.com |
| **Owner** | Harry D. Hwang |
| **Master Admin Email** | harryhwang37@gmail.com |
| **Type** | Professional personal-branding + thought-leadership platform |
| **GitHub** | https://github.com/thekuhn37/hdhmarketfrontier |

### Purpose

HDH Market Frontier is a professional insight platform where Harry D. Hwang publishes original analysis and commentary on financial markets, market data infrastructure, AI applications in finance, and digital assets. It is designed to establish authority and professional credibility in the global financial markets industry.

### Core Themes

| Theme | Slug | Focus |
|---|---|---|
| Markets | `/markets` | Market structure, trading, liquidity, global exchange dynamics |
| Data | `/data` | Market data strategy, governance, distribution, data-driven finance |
| Infrastructure | `/infrastructure` | Financial market infrastructure, connectivity, technology platforms |
| AI | `/ai` | AI applications in finance, data, and market operations |
| Digital Assets | `/digital-assets` | Tokenization, digital securities, stablecoins, market structure evolution |

### Target Audience

- Financial markets professionals (exchanges, brokers, asset managers, hedge funds)
- Market data and infrastructure specialists
- Quantitative researchers and technologists
- Fintech professionals and regulators
- Institutional decision-makers in the financial industry
- Academic researchers in finance and technology

### Brand Positioning

> *"Bridging financial markets, data, and emerging technologies through strategic insights and industry research."*

The platform positions Harry as a globally-minded, institutionally-credible thought leader — not a retail blogger. The tone, design, and content strategy all reinforce this positioning.

---

## 2. Brand & Design Identity

### Design Philosophy

**Institutional + modern finance.** The visual language draws from professional financial terminals, Bloomberg-style density, and modern SaaS products. It avoids the look of personal blogs or generic portfolios.

### Color Palette

| Role | Value | Usage |
|---|---|---|
| Navy (primary) | `#0F172A` | Background darks, headings, primary buttons |
| Steel | `#1E3A5F` | Secondary navy, hover states |
| Sky Accent | `#38BDF8` | Highlights, links, badges, animated elements |
| Accent Dark | `#0EA5E9` | Active states, stronger accents |
| Text Primary | `#111827` | Main body text |
| Text Secondary | `#4B5563` | Subheadings, labels |
| Text Muted | `#6B7280` | Captions, metadata |
| Border | `#E5E7EB` | Card borders, dividers |
| Surface | `#F8FAFC` | Page background, soft card fills |
| White | `#FFFFFF` | Main content areas, cards |

The gradient from `#0F172A` → `#1E3A5F` → `#38BDF8` is the core brand gradient, called `gradient-navy` and used on primary buttons, avatar circles, and the logo.

### Typography

- **Font Family**: Inter (Google Fonts, variable weight)
- **Headings**: Bold, tight tracking (`tracking-tight`)
- **Body**: Regular weight, relaxed line height
- **Accents / labels**: Small caps-style with uppercase + wide tracking (`.uppercase.tracking-wider`)
- **Code**: JetBrains Mono / Fira Code (monospace stack)

### Glassmorphism Usage Rules

Glassmorphism is used sparingly and only where it adds depth without clutter:
- The hero section background overlay uses a subtle radial gradient glass effect
- Navigation bar uses `bg-white/70 backdrop-blur-md` (translucent on scroll)
- Modal overlays use `bg-black/40 backdrop-blur-sm`
- Do NOT apply glassmorphism to content cards — they use solid white backgrounds

### Motion & Animation Principles

- Library: **Framer Motion v12**
- Animations are subtle: fade + slight Y offset (`opacity: 0, y: 24` → `opacity: 1, y: 0`)
- Duration: 0.2–0.5s maximum. Never slow or showy.
- `AnimatePresence` is used for dropdown menus, modals, and search overlay
- Hero section has a canvas-based animated background (`HeroAnimation.tsx`) with financial data visualization
- **IMPORTANT**: Avoid the `ease` property in Framer Motion v12 — it causes type errors. Use `transition={{ duration: 0.X, delay: 0.Y }}` only.

### UI/UX Direction

- Clean, information-dense layouts (not sparse or airy)
- Card-based content architecture with `rounded-2xl` or `rounded-3xl` and `border border-[#E5E7EB]`
- Consistent 8px spacing grid
- Responsive at mobile/tablet/desktop with `md:` and `lg:` breakpoints
- Professional financial platform tone — not a social media profile
- No emojis in UI elements unless explicitly requested
- Use `content-width` utility class for consistent max-width containers

### What to Avoid

- Gradients on backgrounds of content areas (only accent elements)
- Overly rounded corners on text blocks
- Bright or saturated colors outside the defined palette
- Playful or casual typography
- Generic Tailwind UI patterns that look like Vercel/Shadcn demos
- Social-media-style layouts (avatar grids, activity feeds, like counts)

---

## 3. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.6 | App Router, `output: standalone` |
| Language | TypeScript | 5.x | Strict mode |
| Styling | Tailwind CSS | v4 | CSS-based config (`@theme` in globals.css), no `tailwind.config.js` |
| Animation | Framer Motion | 12.x | Avoid `ease` property |
| Database | PostgreSQL (via Supabase) | — | 11 tables, all RLS-enabled + explicit GRANTs (migration 010) |
| Auth | Supabase Auth | @supabase/ssr 0.10.x | Email + Google OAuth |
| Storage | Supabase Storage | — | `thumbnails` bucket (public, admin-only write) |
| i18n | next-intl | v4.x | EN / KO / ZH, `localePrefix: 'always'` |
| AI | OpenAI | 6.x | GPT-4o-mini: summaries, field generation, translation, weekly briefing |
| Email | Resend | 6.x | Contact form + weekly briefing notification — domain `hdhmarketfrontier.com` verified |
| Theme | next-themes | 0.4.x | Dark/light/system mode, `attribute="class"`, SSR-safe |
| Rich Text Editor | **TipTap** | v3.x | Full WYSIWYG editor for post creation/editing |
| Syntax Highlighting | lowlight | v3.x | Used with TipTap CodeBlockLowlight extension |
| Icons | lucide-react | 1.x | **Note**: `Linkedin` and `Chrome` icons do NOT exist in v1 — use `<span>` alternatives |
| Forms | react-hook-form + zod | 7.x / 4.x | Used in contact form |
| Toast | react-hot-toast | 2.x | `<Toaster>` must be in layout |
| Briefing runtime | tsx + rss-parser | 4.x / 3.x | Weekly briefing pipeline — ESM mode via `briefing/package.json` with `"type":"module"` |
| Deployment | Google Cloud Run | — | Docker, `output: standalone` |
| DNS/CDN | Cloudflare | — | Domain registrar + CDN + WAF |

### Critical Library Notes

- **Supabase typed client**: `createBrowserClient<Database>` and `createServerClient<Database>` require the `Database` type from `lib/supabase/types.ts`. The `Database` type must use **row-only** definitions (no joined fields like `tags?: Tag[]`). Joining fields must be cast via `as unknown as AppType` after the query. Breaking this rule causes all column selections to return `never`.
- **next-intl v4**: Server components use `getTranslations()`, client components use `useTranslations()`. Navigation helpers (`Link`, `useRouter`, `usePathname`) come from `@/i18n/navigation`, not `next/navigation`.
- **Next.js redirect() in try-catch**: `redirect()` from `next/navigation` throws a `NEXT_REDIRECT` error internally. If wrapped in `try-catch`, the redirect is silently swallowed. Always call `redirect()` outside try-catch blocks.
- **TipTap v3**: `BubbleMenu` is imported from `@tiptap/react/menus` (subpath), not from `@tiptap/react`. All extensions use named exports (e.g., `import { Table } from '@tiptap/extension-table'`). The `TableKit` named export from `@tiptap/extension-table` bundles all four table sub-extensions. Set `immediatelyRender: false` in `useEditor` options to avoid SSR hydration issues.
- **Content format**: Post content is stored as **HTML** in the `posts.content TEXT` column. TipTap reads and writes HTML natively. AI endpoints receive plain text (HTML tags stripped before sending).

---

## 4. Information Architecture

### Site Structure

```
/ (redirects to /en)
├── /en
│   ├── /                    Home page
│   ├── /about               About Harry D. Hwang
│   ├── /markets             Markets category page
│   ├── /data                Data category page
│   ├── /infrastructure      Infrastructure category page
│   ├── /ai                  AI category page
│   ├── /digital-assets      Digital Assets category page
│   ├── /contact             Contact form page
│   ├── /search              Full-text search
│   ├── /posts/[slug]        Post detail page (with AI translation)
│   ├── /login               Email + Google OAuth login
│   ├── /signup              Account creation
│   ├── /onboarding          Post-signup profile completion (2-step)
│   ├── /profile             Full account management page
│   ├── /admin               Admin dashboard (admin only)
│   │   ├── /posts           Post list + management
│   │   ├── /posts/new       TipTap rich text editor (create)
│   │   ├── /posts/[id]      TipTap rich text editor (edit existing post)
│   │   ├── /comments        Comment moderation
│   │   ├── /contact-messages Contact form inbox
│   │   └── /ai-drafts       AI-generated draft posts
│   ├── /privacy-policy
│   ├── /cookie-policy
│   └── /terms-of-use
├── /ko                      All above routes in Korean
├── /zh                      All above routes in Chinese
└── /api
    ├── /auth/callback        OAuth callback handler
    ├── /auth/logout          Logout (POST)
    ├── /auth/delete-account  Account deletion (POST, server-side)
    ├── /ai/generate-summary  AI summary from content (POST)
    ├── /ai/generate-fields   AI title/slug/SEO from content (POST)
    ├── /comments             GET (approved public), POST (submit), PATCH (admin status update)
    └── /contact              Contact form submission (rate-limited)
```

### GNB (Global Navigation Bar)

The Header is a **client component** that self-manages auth state via `onAuthStateChange`. It does NOT receive user data as props from the layout.

**Before login:**
- Logo | Markets | Data | AI | Digital Assets | [Search] [Language] [Login button]

**After login (non-admin):**
- Logo | Markets | Data | AI | Digital Assets | [Search] [Language] [Avatar + name ▾]
- Dropdown: Profile | Logout

**After login (admin):**
- Logo | Markets | Data | AI | Digital Assets | [Search] [Language] [Avatar + name ▾]
- Dropdown: Profile | **Admin Dashboard** | Logout

Language switcher cycles: EN → KR → 中文
The user's display name (or email prefix before `@`) appears next to the avatar on desktop.

### Footer Structure

Dark navy background (`#0F172A`). Two content columns + bottom bar:
1. **Brand** (6/12 cols): Logo, description, disclaimer box, LinkedIn + Contact buttons. Contact button navigates to `/contact` page (not mailto).
2. **Explore** (5/12 cols): All main nav links in a 2-column grid + `<FooterAdminLink>` (admin only, client-side). **Legal column removed** — links moved to bottom bar.
3. **Bottom bar**: Copyright left | Privacy Policy · Cookie Policy · Terms of Use right (inline, separated by `·`)

`FooterAdminLink` is a client component that **subscribes to `onAuthStateChange`** (not just a one-time mount check) — the admin link disappears immediately on logout without a page refresh. Non-admins and logged-out users see nothing.

**Spacing**: `pt-80` top padding on main content area — intentionally generous for institutional feel.

### Scroll Behaviour

- **Logo click**: If already on `/`, scrolls to top smoothly (`window.scrollTo`). From any other page, navigates to `/`. Implemented via `onClick` on a `<button>` in `Header.tsx`.
- **ScrollToTop button**: `components/layout/ScrollToTop.tsx` — fixed at `bottom-[20vh] right-8`, appears after scrolling 400px, pale grey border (`border-[#D1D5DB]`), smooth fade + slide animation (`transition-all duration-300`), label "Top" with `ArrowUp` icon.
- **ScrollToBottom button**: `components/layout/ScrollToBottom.tsx` — fixed at `bottom-[12vh] right-8` (below Top), appears after scrolling 400px (same threshold as Top), hides automatically when within 40px of page bottom. Same animation and style as ScrollToTop. Both registered in `app/[locale]/layout.tsx`.

### Hero Section

Full-viewport height (`min-h-screen`). Three layers:
1. Canvas-based animated background (`HeroAnimation.tsx`) — financial data visualization, loaded dynamically with `ssr: false`
2. Radial gradient overlays for depth
3. Centered content: site name, subtitle, description, two CTAs (Read Latest Insights / About)

A scroll-down chevron appears at the bottom.

### Post Card Layout

Each `PostCard` shows:
- Thumbnail (with category accent pill overlay)
- Category pill (color-coded per theme)
- Title (2-line clamp)
- Summary excerpt (3-line clamp)
- Reading time | View count | Published date
- Author attribution

**Featured variant** (`variant="featured"`): Full-bleed image with darkened gradient overlay (`from-[#0F172A]/20 via-[#0F172A]/65 to-[#0F172A]/95`). "Read More" button appears at bottom-right, turns sky-blue on hover. The entire card is a `<Link>` — the button is a `<span>` styled as a button to avoid nested anchors.

### Category Page Layout

`CategoryPageLayout` component handles all 5 category pages. It:
- Fetches posts filtered by `category` AND `language = locale` (so posts are locale-matched)
- Applies the category's `accentColor` to pills and UI accents
- Renders a grid of `PostCard` components
- Shows empty state if no posts
- Supports **pagination**: `PAGE_SIZE = 9`, uses Supabase `.range(offset, offset+PAGE_SIZE-1)` with `{ count: 'exact' }`. Accepts a `page` prop; all 5 category pages read `searchParams: Promise<{ page?: string }>` (Next.js 16 pattern).
- Renders `<Pagination>` component at the bottom (windowed: shows ±2 pages around current with ellipsis for gaps). Page 1 URL is the base path (no `?page=`); pages 2+ use `?page=N`.

---

## 5. Authentication & Authorization

### Auth Provider

Supabase Auth via `@supabase/ssr`. Two clients:
- **Browser client**: `lib/supabase/client.ts` — `createBrowserClient<Database>`
- **Server client**: `lib/supabase/server.ts` — `createServerClient<Database>` (cookie-based session)
- **Admin client**: `lib/supabase/server.ts` — `createAdminClient()` — uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS, server-side only. Uses `createClient` from `@supabase/supabase-js` directly (NOT `createServerClient` from `@supabase/ssr`) — the SSR client does not properly activate service-role permissions. Imported as `createSupabaseClient` alias to avoid name clash with the exported `createClient()` user function.

### Login Methods

| Method | Status | Notes |
|---|---|---|
| Email + Password | ✅ Active | Requires email confirmation |
| Google OAuth | ✅ Active | Enabled in Supabase Dashboard → Auth → Providers. Redirect URI: `https://onpejvbqpgdyhfhlmvux.supabase.co/auth/v1/callback` |
| LinkedIn OAuth | ❌ Not configured | Supabase does not natively support LinkedIn yet |

### Auth Flow

1. User signs up at `/en/signup`
2. Confirmation email sent by Supabase
3. User clicks confirmation link → hits `/api/auth/callback`
4. Callback handles two token types:
   - `token_hash` + `type` → `verifyOtp()` (email-based: password reset, confirmation)
   - `code` → `exchangeCodeForSession()` (OAuth PKCE: Google)
5. If `type === 'recovery'` → redirect immediately to `/{locale}/profile?recovery=true`
6. Otherwise checks `profiles.onboarding_completed`
7. If `false` → redirects to `/en/onboarding`
8. If `true` → redirects to home (or `next` param if provided)

### Password Change & Reset Flow

**Changing password (logged in):**
- Requires current password — verified via `signInWithPassword(email, currentPassword)` before calling `updateUser({ password: newPassword })`
- "Forgot your password?" button on the profile security section sends a reset email via `resetPasswordForEmail`
- After clicking the reset email link → callback detects `type=recovery` → redirects to `/profile?recovery=true` → current password field is hidden; user sets new password directly

**Forgot password (login page):**
- "Forgot password?" button on login page — user must enter their email first, then click the button
- Sends reset email via Resend; button text changes to "Reset email sent" and disables to prevent duplicates
- Same recovery flow as above

### Onboarding Flow (Post-Signup)

2-step process at `/en/onboarding`:

**Step 1 — Required:**
- Display Name (required)
- Country of Residence (required, alphabetically sorted)
- Privacy Policy Consent (required checkbox)
- Analytics Consent (optional checkbox)

**Step 2 — Optional (Professional Profile):**
- Company / Organization
- Job Title
- Industry Type (multi-select checkboxes — 20 options)
- Main Interests (multi-select checkboxes — 14 options)
- Discovery Source (single select — 9 options)

On completion, `onboarding_completed = true` is saved to `profiles`. The step-2 "Skip for now" button still marks onboarding as complete.

Existing users who haven't completed onboarding see a blue banner on the Profile page with a "Complete Now" link.

### User Profile Fields

Extended `profiles` table (after migration 004):

| Field | Type | Description |
|---|---|---|
| `display_name` | text | Public display name |
| `avatar_url` | text | Profile photo URL (set by Google OAuth) |
| `role` | text | `'user'` or `'admin'` |
| `provider` | text | `'email'` or `'google'` |
| `country` | text | Country of residence |
| `company` | text | Company or organization |
| `job_title` | text | Job title or role |
| `industry_types` | text[] | Multi-select industry categories |
| `interests` | text[] | Multi-select interest areas |
| `discovery_source` | text | How they found the site |
| `privacy_consent` | boolean | GDPR privacy consent |
| `analytics_consent` | boolean | Cookie/analytics consent |
| `onboarding_completed` | boolean | Whether onboarding was finished |

### Admin Authorization Model

**Role-based**: `profiles.role = 'admin'`

**Master admin account**: `harryhwang37@gmail.com`

To assign admin role in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'harryhwang37@gmail.com';
```

**Protection layers:**
1. `app/[locale]/admin/layout.tsx` — Server-side gate. Runs before any admin page renders. Checks `profiles.role = 'admin'`. Redirects to `/en/login` if unauthenticated, to `/` if authenticated but not admin. **This is the primary security gate.**
2. Each individual admin page also calls `requireAdmin()` — defense in depth.
3. Supabase RLS policies restrict data access at the database level.
4. Footer and Header admin links are hidden client-side (but this is UI only, not security).

**Critical Note**: `redirect()` must NOT be called inside `try-catch`. In Next.js App Router, `redirect()` throws `NEXT_REDIRECT` internally — wrapping it in try-catch swallows the redirect silently, creating a security bypass. The `admin/layout.tsx` is written correctly without try-catch.

### Header Auth State

The Header (`components/layout/Header.tsx`) is a client component. It uses:
```typescript
supabase.auth.getSession()      // Initial state on mount
supabase.auth.onAuthStateChange // Reactive updates
supabase.from('profiles').select('id, email, display_name, avatar_url, role')
```

This means the header updates **immediately** after login/logout without page refresh, across all locales.

---

## 6. Database Architecture

All tables have Row Level Security (RLS) enabled.

### profiles

Core user data, extends Supabase `auth.users`.

```sql
id              uuid    PRIMARY KEY references auth.users(id)
email           text    NOT NULL
display_name    text
avatar_url      text
role            text    DEFAULT 'user'  -- 'user' | 'admin'
provider        text                    -- 'email' | 'google'
country         text                    -- Added in 004
company         text                    -- Added in 004
job_title       text                    -- Added in 004
industry_types  text[]  DEFAULT '{}'    -- Added in 004
interests       text[]  DEFAULT '{}'    -- Added in 004
discovery_source text                   -- Added in 004
privacy_consent  boolean DEFAULT false  -- Added in 004
analytics_consent boolean DEFAULT false -- Added in 004
onboarding_completed boolean DEFAULT false -- Added in 004
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

A trigger (`trg_profiles_updated_at`) auto-updates `updated_at`. A trigger (`handle_new_user`) auto-creates a `profiles` row when a new `auth.users` row is inserted.

**RLS**: Public can SELECT (for author display on posts). Only self can UPDATE own row. Admins have full access.

### posts

```sql
id              uuid    PRIMARY KEY
title           text    NOT NULL
slug            text    UNIQUE NOT NULL
summary         text
content         text    NOT NULL         -- HTML (written/read by TipTap rich text editor)
thumbnail_url   text
category        text                     -- 'Markets' | 'Data' | 'Infrastructure' | 'AI' | 'Digital Assets'
language        text    DEFAULT 'en'     -- 'en' | 'ko' | 'zh'
translation_group_id uuid               -- Links translated versions of same post
status          text    DEFAULT 'draft'  -- 'draft' | 'published' | 'archived'
author_id       uuid    REFERENCES profiles(id)
source_url      text
seo_title       text
seo_description text
og_image_url    text
reading_time    int     DEFAULT 0        -- Minutes
view_count      int     DEFAULT 0
is_featured     boolean DEFAULT false
is_popular      boolean DEFAULT false
published_at    timestamptz
created_at      timestamptz
updated_at      timestamptz
```

**RLS**: Public can read `published` posts. Authors can manage their own. Admins have full access.

### tags / post_tags

```sql
-- tags
id          uuid PRIMARY KEY
name        text UNIQUE
slug        text UNIQUE
created_at  timestamptz

-- post_tags (join table)
post_id     uuid REFERENCES posts(id)
tag_id      uuid REFERENCES tags(id)
PRIMARY KEY (post_id, tag_id)
```

### post_translations

AI translation cache. One row per post per target locale.

```sql
id       uuid PRIMARY KEY
post_id  uuid REFERENCES posts(id)
locale   text                      -- 'ko' | 'zh' (never 'en', original is in posts table)
title    text
summary  text
content  text
created_at timestamptz
UNIQUE (post_id, locale)
```

**RLS**: Public SELECT. Service-role-only INSERT/UPDATE (translations are server-generated).

### comments

```sql
id         uuid PRIMARY KEY
post_id    uuid REFERENCES posts(id)
user_id    uuid REFERENCES profiles(id)
content    text
status     text DEFAULT 'pending'   -- 'pending' | 'approved' | 'hidden' | 'deleted'
is_private boolean DEFAULT false    -- Added in migration 008; private = admin-only visibility
parent_id  uuid REFERENCES comments(id) ON DELETE CASCADE  -- Added in migration 009; for reply threads
created_at timestamptz
updated_at timestamptz
```

**RLS**: Public can read `approved` AND `is_private = false` comments. Users can create. Admins have full access.

**Auto-approve**: Public comments (`is_private = false`) are inserted with `status = 'approved'` and appear immediately. Private comments start as `'pending'` and are admin-review only.

**Reply threads**: `parent_id` references another comment in the same table. The API returns a flat list; `CommentSection.tsx` groups them client-side using `filter` + `reduce` into `topLevel[]` + `repliesMap`.

**UUID guard**: `post_id` must be a valid UUID — the API validates with a regex and returns 400 for non-UUID IDs (e.g., sample post IDs like `"1"`). The post page also guards with a UUID regex before rendering `<CommentSection>`.

### contact_messages

```sql
id           uuid PRIMARY KEY
name         text
email        text
organization text
subject      text
message      text
status       text DEFAULT 'unread'  -- 'unread' | 'read' | 'archived'
created_at   timestamptz
```

**RLS**: Public INSERT only (anyone can submit). Admins can SELECT/UPDATE.

### page_views / post_views

Anonymous tracking tables.

```sql
-- page_views
id          uuid PRIMARY KEY
path        text
user_id     uuid (nullable)
session_id  text (nullable)
referrer    text
user_agent  text
language    text
created_at  timestamptz

-- post_views
id               uuid PRIMARY KEY
post_id          uuid REFERENCES posts(id)
user_id          uuid (nullable)
session_id       text (nullable)
referrer         text
duration_seconds int
created_at       timestamptz
```

### ai_drafts

AI-generated draft content awaiting admin review.

```sql
id                uuid PRIMARY KEY
title             text
source_type       text            -- 'market_brief' | 'manual' etc.
source_url        text
raw_data          jsonb
generated_summary text
generated_content text
status            text DEFAULT 'draft'  -- 'draft' | 'pending_review' | 'published' | 'rejected'
created_at        timestamptz
updated_at        timestamptz
```

### cookie_consents

GDPR compliance log.

```sql
id           uuid PRIMARY KEY
user_id      uuid (nullable)
session_id   text (nullable)
essential    boolean DEFAULT true
analytics    boolean DEFAULT false
functional   boolean DEFAULT false
created_at   timestamptz
```

---

## 7. Translation System

### Routing

next-intl v4, `localePrefix: 'always'`. All routes require a locale prefix:
- `/en/...` — English (default)
- `/ko/...` — Korean
- `/zh/...` — Simplified Chinese

UI strings live in `messages/en.json`, `messages/ko.json`, `messages/zh.json`.

Namespaces: `nav`, `lang`, `hero`, `home`, `themes`, `posts`, `search`, `about`, `contact`, `auth`, `onboarding`, `profile`, `comments`, `admin`, `cookies`, `footer`, `errors`, `meta`

### Post Language Architecture

Each post has a `language` field (`'en'`, `'ko'`, or `'zh'`). Category/home pages filter posts by `language = current_locale`. This means Korean posts only appear on the KR site, English posts on EN, etc.

Posts can be linked across languages via `translation_group_id` — a shared UUID that connects the same article written natively in multiple languages.

### AI Translation Flow (On-Demand)

When a visitor views a post in a language different from `post.language`:

1. Check `post_translations` table for `(post_id, target_locale)` — cache hit → serve immediately
2. If cache miss and `OPENAI_API_KEY` is set → call `lib/ai/translate.ts`
3. `translatePost()` calls GPT-4o-mini via direct `fetch` to OpenAI REST API (NOT via the `openai` npm package — dynamic `import('openai')` was unreliable with Turbopack)
4. Display variables (`displayTitle`, `displaySummary`, `displayContent`) are set **before** the cache write, so translation is shown even if the Supabase upsert fails
5. Result stored in `post_translations` via `createAdminClient()` (service role, bypasses RLS)
6. All subsequent views for that post+locale pair use the cached translation (zero token cost)
7. If no API key → serve original with an amber notice banner

**Summary fallback**: Uses `||` (not `??`) so that if OpenAI returns `null` for summary (a known edge case), the original summary is shown rather than a blank box.

**FeaturedInsight**: The featured post query does NOT filter by `language = locale`. It returns the same featured post regardless of locale — the post page handles translation on demand.

**IMPORTANT — env var precedence**: System-level env vars (e.g., `export OPENAI_API_KEY=...` in `~/.zshrc`) override `.env.local` in Next.js. If the API key is set in both places, the shell value wins. Resolved by removing the export from `~/.zshrc` and keeping the key only in `.env.local`.

**IMPORTANT — translation caching RLS fix**: The `post_translations` INSERT policy requires `auth.role() = 'service_role'`. This only works when using `@supabase/supabase-js` `createClient` with the service role key directly. Using `@supabase/ssr` `createServerClient` with the service role key does NOT activate service-role mode — the upsert fails with error `42501`. After this fix, translations are cached correctly on first load and subsequent locale switches are instant (zero OpenAI calls).

### Translation Banners

- **Blue badge**: "AI Translated" — shown when content was auto-translated by GPT-4o-mini
- **Amber notice**: "Original language shown" — shown when translation was requested but no API key configured
- Both include a "View original" link using `<Link locale={post.language}>`

---

## 8. Blog & Post System

### Post Editor (Admin Only)

Located at `/admin/posts/new` (create) and `/admin/posts/[id]` (edit). Both use the shared `components/admin/PostEditor.tsx` client component, which wraps `components/editor/RichEditor.tsx`.

**TipTap RichEditor extensions (all active):**
- StarterKit (bold, italic, strike, code, blockquote, bullet list, ordered list, heading H1-H3, horizontal rule, hard break)
- Underline, Link (opens in new tab), Image (with `allowBase64: false`)
- Placeholder, TextAlign (left/center/right on headings + paragraphs)
- Highlight (yellow mark), TaskList + TaskItem (checklists)
- CodeBlockLowlight (syntax highlighting via lowlight/common — ~40 languages)
- TableKit (table, table-row, table-header, table-cell bundled)
- CharacterCount, Typography (smart quotes, etc.)

**Toolbar controls:**
Undo/Redo | H1 H2 H3 | Bold Italic Underline Strikethrough Code Highlight | Align L/C/R | Bullet Ordered Task lists | Blockquote Code-block HR | Link Image Table

**BubbleMenu** (floating over text selection): Bold Italic Underline Strike | H2 H3 | Code Highlight | Link

**Image upload within editor body:**
- Toolbar button → file picker → Supabase Storage `thumbnails/posts/body/`
- Drag & drop onto editor area → same upload flow
- Paste from clipboard → same upload flow
- Maximum 10 MB per image

**PostEditor features:**
- Title + AI-generate button
- Slug (auto-generated from title) + AI-generate button
- Category, Language, Status selectors
- Featured / Popular checkboxes
- Thumbnail upload (drag-and-drop or click, max 5 MB, stored in `thumbnails/posts/`)
- Summary textarea + AI-generate button
- Rich text content editor (TipTap)
- Tags (comma-separated) + Source URL
- SEO title (auto-fills from post title, manually overridable, 60-char counter)
- SEO description (auto-fills from summary, 160-char counter)
- "Generate All with AI" for all SEO fields at once
- Delete post (edit mode only) with confirmation dialog
- Preview link opens live post in new tab (edit mode only)

### AI Field Generation

`/api/ai/generate-fields` — admin-protected POST endpoint. Content is stripped of HTML tags before sending to AI.

In dev (no OpenAI key): returns rule-based fields (extracts H1/first sentence for title, slugifies for slug, truncates for SEO).

With OpenAI key: calls GPT-4o-mini to generate compelling title, clean slug, SEO title (≤60 chars), and SEO description (≤160 chars) from the post content.

### AI Summary Generation

`/api/ai/generate-summary` — content HTML is stripped to plain text before AI call. Returns:
- Without OpenAI: extractive summary (first N sentences)
- With OpenAI: GPT-4o-mini abstractive summary

### Post Reading Time

`lib/utils/reading-time.ts` — estimates reading time from word count (200 WPM). HTML tags are stripped before calculation. Stored as `reading_time` (minutes) in `posts` table.

### SEO

Each post has:
- `seo_title` (overrides page `<title>`)
- `seo_description` (meta description)
- `og_image_url` (Open Graph image, falls back to `thumbnail_url`)
- Canonical URL per locale

The sitemap (`app/sitemap.ts`) generates entries for all published posts × all 3 locales.

### Post Rendering

Post content (HTML from TipTap) is rendered via `dangerouslySetInnerHTML` inside a `div.article-body`. The `article-body` CSS class in `globals.css` applies prose styling (headings, lists, blockquotes, code blocks, tables, images). The `tiptap-prose` class (also in `globals.css`) applies the same styles within the editor for WYSIWYG consistency.

### Reading Progress Bar

`components/posts/ReadingProgress.tsx` — client component, rendered at the top of each post page. Fixed at `top-16` (bottom of the header), `z-40`, `h-[3px]`, `pointer-events-none`, `aria-hidden`. Gradient: `from-[#BAE6FD] via-[#38BDF8] to-[#7DD3FC]` (pale-blue → sky → pale-blue). Width tracks `window.scrollY / (scrollHeight - innerHeight)` as a percentage.

### Comment Section

`components/posts/CommentSection.tsx` — client component rendered at the bottom of real DB posts (UUID ID only — sample posts are excluded). Features:

- Fetches approved public comments on mount via `GET /api/comments?postId=...`
- Comment form: textarea + public/private toggle (custom CSS switch) + "Post Comment" button
- **Public comment** → `status = 'approved'`, added to local state immediately (optimistic UI) via `makeTempComment()` helper
- **Private comment** → `status = 'pending'`, shows "sent to admin" confirmation, not shown in feed
- Reply button on each top-level comment opens an inline reply textarea
- Comment tree built client-side: `topLevel = comments.filter(c => !c.parent_id)`, `repliesMap = reduce(...)` keyed by `parent_id`
- Joined user profile (`display_name`, `avatar_url`) displayed per comment

### Comment API (`/api/comments`)

- `GET`: returns approved + `is_private = false` comments for a post, with joined user profile
- `POST`: validates UUID `post_id`, sets `status` based on `is_private`, accepts optional `parent_id`
- `PATCH`: admin-only status update (`approved` / `hidden` / `pending` / `deleted`)

---

## 9. Weekly Market Briefing Pipeline

### Overview

A 9-agent automated pipeline that runs every **Monday at 22:00 UTC** via GitHub Actions. It generates a weekly institutional-grade market briefing, saves it as a Supabase draft post, and emails the admin a review link.

### Architecture

```
GitHub Actions (Mon 22:00 UTC)
  → Agent 1: market-data   — Yahoo Finance v8 chart API (27 symbols) + CoinGecko (BTC/ETH)
  → Agent 2: news          — rss-parser across 4 RSS feeds (MarketWatch, Yahoo, CNBC, Reuters)
  → Agent 3: calendar      — Finnhub economic calendar (optional, graceful skip if no key)
  → Agent 4: analysis      — GPT-4o-mini writes 11-section HTML article
  → Agent 5: visualization — 3 QuickChart.io dark-themed bar charts (equity/FX/commodity)
  → Agent 6: seo           — GPT-generated SEO metadata
  → Agent 7: quality       — GPT QC review (score < 60 warns but does not stop pipeline)
  → Agent 8: upload        — Supabase draft post insert via service_role
  → Agent 9: notify        — Resend HTML email with edit link
```

### Article Structure (11 Sections)

1. Executive Summary
2. **Weekly Insights** — editorial centerpiece, 2–3 paragraphs on week's key themes
3. Global Equity Markets (table + analysis)
4. Futures & Volatility
5. FX Markets
6. Commodities
7. Cryptocurrency
8. Regional Highlights (Asia-Pacific / Europe subsections)
9. Key Market News
10. Economic Calendar Ahead
11. **Weekly Outlook** — forward-looking, what to watch next week

### File Structure

```
briefing/
  agents/
    market-data/   calendar/   news/   analysis/
    visualization/ seo/        quality/ upload/   notify/
  jobs/dailyBriefing.ts   — orchestrator (runWeeklyBriefing)
  lib/openaiClient.ts     — OpenAI singleton
  lib/supabaseAdmin.ts    — service_role Supabase client
  lib/resendClient.ts     — Resend client
  prompts/                — GPT system + user prompts
  types/index.ts          — shared TypeScript interfaces
  utils/format.ts logger.ts retry.ts
  package.json            — {"type":"module"} — required for ESM on Node 26+
.github/workflows/daily-briefing.yml  — cron + GitHub Actions config
```

### Key Technical Notes

- **Yahoo Finance**: Uses direct `fetch` to `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}` with a browser User-Agent header. Does NOT use `yahoo-finance2` library (its crumb-based auth was blocked by Yahoo). CoinGecko used for BTC/ETH (no auth required).
- **ESM module resolution**: `briefing/package.json` with `"type":"module"` enables ESM for the entire directory so Node resolves ESM-only packages (like the old yahoo-finance2). Required because Node 26+ has stricter cycle detection with `--import tsx/esm`.
- **Env loading**: Local runs use `--env-file-if-exists=.env.local` (silently skips if missing). GitHub Actions injects env vars via the workflow `env:` block — no `.env.local` file on runners.
- **Cost**: ~$0.003/run (3 GPT-4o-mini calls, ~10,000 tokens total). ~$0.06/month.
- **Graceful degradation**: Optional agents (news, calendar, charts, quality, notify) skip on error without stopping the pipeline. Required agents (market-data, analysis, upload) fail the pipeline if they error.
- **Draft-only output**: Articles are always saved as `status: 'draft'`. Admin reviews and publishes manually. Nothing goes live automatically.

### GitHub Actions Secrets Required

| Secret | Purpose |
|---|---|
| `OPENAI_API_KEY` | GPT-4o-mini calls |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Draft post insert (bypasses RLS) |
| `RESEND_API_KEY` | Admin notification email |
| `NEXT_PUBLIC_SITE_URL` | Edit URL in email (e.g. `https://hdhmarketfrontier.com`) |
| `FINNHUB_API_KEY` | Optional — economic calendar |

### Running Locally

```bash
npm run briefing   # loads .env.local automatically via --env-file-if-exists
```

Yahoo Finance returns 429 errors on residential IPs (rate limit). GitHub Actions (AWS IPs) is not rate-limited. Local test runs produce zero-data articles — this is expected.

---

## 10. Admin Dashboard

### Access Control

- **Primary gate**: `app/[locale]/admin/layout.tsx` — server component, runs before any admin page
- Checks `supabase.auth.getUser()` + `profiles.role = 'admin'`
- Unauthenticated → redirect to `/en/login`
- Non-admin → redirect to `/`
- No try-catch around `redirect()` calls (critical)

### Admin Sections

| Section | Route | Status | Description |
|---|---|---|---|
| Dashboard | `/admin` | ✅ Implemented | Stats overview, recent messages, top posts |

| Posts List | `/admin/posts` | ✅ Implemented | Table view of all posts |
| Create Post | `/admin/posts/new` | ✅ Implemented | Full TipTap editor with AI + image upload |
| Edit Post | `/admin/posts/[id]` | ✅ Implemented | Pre-populated TipTap editor, delete + preview |
| Comments | `/admin/comments` | ✅ Implemented | Expandable rows — click to see full comment, PRIVATE badge, Reply badge, status action buttons (Approve / Hide / Set Pending / Delete). `AdminCommentsList` client component updates status via `PATCH /api/comments` and reflects change optimistically in local state. |
| Contact Messages | `/admin/contact-messages` | ✅ Implemented | View submissions, reply via mailto |
| AI Drafts | `/admin/ai-drafts` | ✅ Implemented (placeholder) | Review AI-generated drafts |
| Users | `/admin/users` | ⚠️ Sidebar link exists, page not built | Planned |
| Analytics | `/admin/analytics` | ⚠️ Sidebar link exists, page not built | Planned |
| Settings | `/admin/settings` | ⚠️ Sidebar link exists, page not built | Planned |

### AdminLayout Component

`components/admin/AdminLayout.tsx` — client component. Renders:
- Collapsible sidebar with nav links (Dashboard, Posts, Comments, Users, Analytics, Contact Messages, AI Drafts, Settings)
- Mobile hamburger menu
- Back to site link
- Wraps all admin page content

---

## 10. Analytics & Tracking

### Current Implementation

- `page_views` table — tracks all page visits (path, user_id, session_id, referrer, language)
- `post_views` table — tracks post-specific views with duration
- `view_count` column on `posts` table — denormalized count for fast sorting
- `is_popular` flag on posts — manually settable by admin

### Cookie Consent Implications

- Analytics tracking should only fire if `analytics_consent = true`
- Cookie consent is captured via `CookieBanner` component (client-side) and stored in `cookie_consents` table
- Users who reject analytics cookies should not have their page views recorded

### Future Plans

- Segment users by `industry_types`, `country`, `interests` from profiles
- Build audience analytics charts in admin dashboard
- Export audience data for content strategy decisions
- Reading time completion tracking (scroll depth events)

---

## 11. Security Rules

### Never Commit

- `.env`, `.env.local`, `.env.production`, `.env.staging`, `.env.development` — all gitignored
- Real API keys or secrets in any committed file
- The `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code

### API Key Handling

| Key | Exposure | Usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser) | Supabase endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) | Supabase anon client — safe, RLS-protected |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Admin operations, bypasses RLS |
| `OPENAI_API_KEY` | Server-only | AI generation endpoints |
| `RESEND_API_KEY` | Server-only | Contact form email delivery |

### Admin Route Protection

All `/admin/*` routes are protected by `app/[locale]/admin/layout.tsx` (server-side, no try-catch). This is the primary gate. Each page also has its own `requireAdmin()` for defense in depth, but these have a known bug: they call `redirect()` inside `try-catch`, which swallows the redirect in development. This is harmless since the layout gate already blocks non-admins before the page runs.

### Row Level Security + Explicit GRANTs (migration 010)

All 11 database tables have RLS enabled. Migration 010 adds explicit `GRANT` statements required by Supabase's Data API policy change (May 30 / Oct 30 2026).

| Table | anon | authenticated |
|---|---|---|
| `profiles` | SELECT (id, display_name, avatar_url, role only — email hidden) | SELECT + UPDATE |
| `posts` | SELECT (published only via RLS) | SELECT + full DML (admin RLS) |
| `tags` / `post_tags` | SELECT | SELECT + full DML (admin RLS) |
| `comments` | SELECT (approved + `is_private = false`) | SELECT + full DML |
| `contact_messages` | INSERT | INSERT + SELECT + UPDATE + DELETE (admin RLS) |
| `page_views` / `post_views` | INSERT | INSERT |
| `ai_drafts` | none | SELECT + full DML (admin RLS) |
| `cookie_consents` | SELECT + INSERT | SELECT + INSERT + UPDATE |
| `post_translations` | SELECT | SELECT (writes via service_role only) |

`service_role` bypasses RLS entirely — it is never listed in GRANT statements.

**Developer reference**: `docs/supabase-security-checklist.md` explains when to use each role, how to write GRANT + RLS policy statements, common mistakes, and verification queries.

**Future table rule**: every new `CREATE TABLE public.*` must be followed immediately by explicit GRANTs, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, and `CREATE POLICY` statements. See the template at the bottom of migration 010.

### Contact Form

Rate-limited to 3 submissions per IP per hour in the API route. Validates name, email, subject, message, and privacy consent server-side.

### Production Security Recommendations

- Add **Cloudflare** as CDN/WAF (already using Cloudflare as domain registrar)
- Enable Cloudflare's Bot Fight Mode to block scrapers
- Consider Google Cloud Armor for WAF and DDoS at the Cloud Run level
- Enable Supabase's "Leaked Password Protection" and "MFA" in Auth settings

---

## 12. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values. Never commit `.env.local`.

```env
# ─── Site ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ─── Supabase ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ─── OpenAI (optional) ────────────────────────────────────────────────────────
OPENAI_API_KEY=

# ─── Resend ───────────────────────────────────────────────────────────────────
RESEND_API_KEY=                          # Configured — send-only restricted key
CONTACT_RECEIVER_EMAIL=harryhwang37@gmail.com
```

**Resend status (as of 2026-05-12):**
- API key is set and valid (send-only restricted key)
- Receiver: `harryhwang37@gmail.com`
- Sender: `noreply@hdhmarketfrontier.com` — domain verified in Resend ✅
- DNS records confirmed propagated via Cloudflare

In Supabase dashboard, the keys are now labeled:
- **Publishable key** = `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for browser)
- **Secret key** = `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Project URL** = construct as `https://<reference-id>.supabase.co`

---

## 13. Deployment Plan

### Current Status

- Local development only (`http://localhost:3000`)
- Code is on GitHub: `https://github.com/thekuhn37/hdhmarketfrontier`
- Supabase project is live (free tier)
- Domain `hdhmarketfrontier.com` purchased at Cloudflare Registrar

### Target Architecture

```
User → Cloudflare (DNS + CDN + WAF)
         ↓
    Google Cloud Run (Docker container, Next.js standalone)
         ↓
    Supabase (PostgreSQL + Auth + Storage)
         ↓
    OpenAI API (AI features)
    Resend (Email delivery)
```

### Deployment Steps (When Ready)

1. Ensure all migrations (001–007) are applied in Supabase
2. Confirm `thumbnails` bucket exists and policies are applied (migration 007)
3. Build Docker image: `docker build -t hdhmarketfrontier .`
4. Push to Google Container Registry: `docker push gcr.io/YOUR_PROJECT_ID/hdhmarketfrontier`
5. Deploy to Cloud Run:
   ```bash
   gcloud run deploy hdhmarketfrontier \
     --image gcr.io/YOUR_PROJECT_ID/hdhmarketfrontier \
     --platform managed \
     --region asia-northeast1 \
     --allow-unauthenticated \
     --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=...,..." \
     --memory 512Mi \
     --cpu 1
   ```
6. Update `NEXT_PUBLIC_SITE_URL` to `https://hdhmarketfrontier.com`
7. In Supabase → Auth → URL Configuration: set Site URL to `https://hdhmarketfrontier.com`, add redirect URL `https://hdhmarketfrontier.com/**`
8. Map custom domain in Cloud Run → point Cloudflare DNS to Cloud Run URL

### Estimated Monthly Cost (Low Traffic)

| Service | Cost |
|---|---|
| Supabase Free tier | $0 |
| Google Cloud Run | ~$3–10 |
| OpenAI (GPT-4o-mini) | ~$0–2 |
| Resend Free tier | $0 |
| Cloudflare (domain) | ~$1 (amortized) |
| **Total** | **~$5–15/month** |

---

## 14. Coding Conventions

### Component Structure

- **Server components**: Default for all layout/page files. No `'use client'` directive. Fetch data directly with `await`.
- **Client components**: Add `'use client'` only when needed (event handlers, hooks, auth state). Keep them as leaf components — don't make parent layouts client components.
- **File naming**: `PascalCase` for components (e.g., `PostCard.tsx`), `camelCase` for utilities (e.g., `format.ts`).

### TypeScript

- All components and functions must be typed
- Prefer explicit return types on async server functions
- Supabase join queries must use `as unknown as AppType` cast pattern:
  ```typescript
  const raw = data as unknown as Record<string, unknown>
  return { ...raw, tags: (raw.tags as ...) } as Post
  ```
- The `Database` type in `lib/supabase/types.ts` must use row-only definitions (no joined fields)
- App-level types (`Post`, `Profile`, etc.) may include joined fields and live separately from the `Database` type

### Supabase Query Pattern

```typescript
// ✅ Correct: separate app type from DB type
const { data } = await supabase.from('posts').select('*, tags:post_tags(tag:tags(*))')
const post = data as unknown as Post

// ❌ Wrong: casting DB row type directly (causes 'never')
const post = data as Post
```

### i18n Conventions

- Server components: `const t = await getTranslations({ locale, namespace: 'nav' })`
- Client components: `const t = useTranslations('nav')`
- Navigation: always import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`, never from `next/navigation`
- Locale is always in the URL: `/{locale}/path`

### Slug Conventions

- Post slugs: lowercase, hyphenated, ASCII-safe (e.g., `ai-governance-financial-data`)
- Generated by `slugify()` in `lib/utils/format.ts`

### Comment Policy

Write no comments by default. Only add comments when the WHY is non-obvious: a hidden constraint, a workaround for a known bug, or behavior that would surprise a reader.

### No AI Docblocks

Do not write multi-line JSDoc or docstring blocks. At most one short inline comment where necessary.

---

## 15. Current Progress Status

### Fully Implemented

- ✅ Next.js 16 App Router setup with TypeScript
- ✅ Tailwind CSS v4 with `@theme` design tokens
- ✅ next-intl v4 — EN/KO/ZH routing and message files
- ✅ Supabase client (browser + server + admin) configured
- ✅ Database schema — all 11 tables with RLS (migrations 001–009) + explicit GRANTs (migration 010)
- ✅ Supabase GRANT compliance — migration 010 adds explicit grants for all tables; column-level grant hides email from anon on profiles; security checklist at `docs/supabase-security-checklist.md`
- ✅ Supabase Storage — `thumbnails` bucket (public, admin-only write) via migration 007
- ✅ Supabase Auth — email + Google OAuth (Google provider enabled in dashboard)
- ✅ Auth callback (`/api/auth/callback`) — handles both `token_hash` (email flows) and `code` (OAuth PKCE)
- ✅ Password reset flow — forgot password on login page + profile security section; recovery session bypasses current-password check
- ✅ Password change requires current password verification
- ✅ Header with reactive auth state (onAuthStateChange, no prop drilling)
- ✅ Header logo — scrolls to top on home page, navigates home from other pages
- ✅ Dark mode — complete institutional system (Bloomberg/Linear/Vercel aesthetic); next-themes with class strategy; Sun/Moon toggle in header with Framer Motion animation; CSS semantic token system (`--bg-primary`, `--fg-primary`, etc.); deep blue-black `#0B1120` primary background; all 42 files updated; system preference detection; persists via localStorage
- ✅ ScrollToTop floating button — appears after 400px scroll, `bottom-[20vh] right-8`, pale grey border, smooth fade+slide animation
- ✅ ScrollToBottom floating button — appears after 400px scroll (same threshold), hides near page bottom, `bottom-[12vh] right-8`, same style as ScrollToTop
- ✅ Footer — redesigned: 2-col grid, legal links in bottom bar, Contact navigates to /contact
- ✅ FooterAdminLink — subscribes to auth state changes (fixes logout visibility bug)
- ✅ Hero section with canvas animation
- ✅ Home page (FeaturedInsight, LatestPosts, PopularPosts, AboutSection)
- ✅ Featured card — darker overlay, "Read More" button bottom-right
- ✅ All 5 category pages (Markets, Data, Infrastructure, AI, Digital Assets)
- ✅ Post detail page with AI translation + caching (fetch-based OpenAI call, not SDK import)
- ✅ Reading progress bar — `top-16`, `h-[3px]`, pale-blue gradient, `pointer-events-none`
- ✅ Comment section on post pages — public/private toggle, optimistic UI, reply threads, UUID guard
- ✅ Comment API (`/api/comments`) — GET / POST / PATCH with admin protection on PATCH
- ✅ Login page (email + Google OAuth + working "Forgot password?" button)
- ✅ Signup page
- ✅ Onboarding page (2-step, saves to profiles; country list alphabetically sorted)
- ✅ Profile page (6 sections, per-section save, password change with current-password check, forgot password, delete account; country list alphabetically sorted)
- ✅ Account deletion API route (`/api/auth/delete-account`)
- ✅ Admin dashboard (stats, recent messages, top posts)
- ✅ Admin posts list
- ✅ Admin post editor — TipTap v3 rich text editor with full toolbar, BubbleMenu, image upload into body, syntax-highlighted code blocks, tables, task lists, link insert
- ✅ Admin post edit page (`/admin/posts/[id]`) — pre-populated form, delete with confirmation, preview link
- ✅ Admin comments page — expandable rows with full detail, PRIVATE/Reply badges, status action buttons
- ✅ Admin contact messages page
- ✅ Admin AI drafts page
- ✅ Admin route protection (layout.tsx server gate)
- ✅ About page — headshot photo (`/public/images/headshot2.JPEG`) with 400px circular mask
- ✅ Contact page + API route (rate-limited, saves to DB + sends email via Resend)
- ✅ Resend email delivery — API key configured, domain `hdhmarketfrontier.com` verified, sender: `noreply@hdhmarketfrontier.com`
- ✅ Search page
- ✅ Cookie banner (with consent storage)
- ✅ Privacy Policy, Cookie Policy, Terms of Use pages
- ✅ Sitemap + robots.txt
- ✅ Dockerfile (standalone mode)
- ✅ `.env.example`, `.gitignore`
- ✅ GitHub repository (code pushed, large image files gitignored)
- ✅ Cloudflare domain registered (`hdhmarketfrontier.com`)
- ✅ Weekly Market Briefing pipeline — 9-agent system, Monday 22:00 UTC via GitHub Actions; GPT-4o-mini; Yahoo Finance v8 chart API + CoinGecko; QuickChart.io charts; Resend notification; Supabase draft upload

### Partially Implemented / Known Issues

- ⚠️ Admin users / analytics / settings pages — sidebar links exist but pages not built
- ⚠️ Newsletter section exists (`NewsletterSection.tsx`) but commented out in `app/[locale]/page.tsx` — pending strategy decision
- ⚠️ Seed data (`002_seed_data.sql`) has unescaped apostrophes — SQL syntax error. Skip; create real posts through the admin editor
- ⚠️ LinkedIn OAuth not available in Supabase yet
- ⚠️ Migration 007 idempotency issue — original SQL had no `IF NOT EXISTS` guards; updated SQL now includes DO $$ blocks. Bucket and read policy already exist in Supabase
- ⚠️ Social share buttons on post detail page use `window.location.href` which is empty during SSR — LinkedIn share URL will be empty on initial server render
- ⚠️ Migrations 008, 009, and 010 must be run in Supabase SQL Editor if not yet applied (all safe to re-run)

### Not Yet Started

- ❌ Production deployment to Google Cloud Run
- ❌ Real published content (only hardcoded sample posts exist)
- ❌ RSS / Atom feed
- ❌ Email newsletter subscriber list and campaign sending
- ❌ Full-text search via Supabase `to_tsvector` (current search is basic keyword matching)
- ❌ Dynamic Open Graph images for social sharing
- ❌ Advanced analytics dashboard with charts
- ❌ Recommendation engine (related posts beyond same-category)
- ❌ Bookmarking / saved posts
- ❌ Multi-author support

---

## 16. Priority Roadmap to Professional Blog

This section answers the question: **"What must be done, in what order, to go from the current state to a genuinely professional financial blog?"**

The items are ranked by impact on perceived professionalism and reader experience, not by implementation effort.

---

### TIER 1 — Without these, the site cannot function as a public blog

| # | Task | Why it's blocking |
|---|---|---|
| 1 | **Deploy to production** (Google Cloud Run + Cloudflare) | The site only exists on localhost. No reader can access it. Everything else is irrelevant until this is done. |
| 2 | **Publish real content** (5–10 original articles) | The site currently shows hardcoded sample posts. A blog without real articles is not a blog. Use the TipTap editor now available in the admin panel. |
| 3 | **Run migration 007** in Supabase SQL Editor | Required for thumbnail and body image uploads to work in production. Already idempotent — safe to run again. |

---

### TIER 2 — Core blog functionality that readers expect

| # | Task | Why it matters |
|---|---|---|
| 4 | ~~**Comment input UI on post pages**~~ ✅ Done | Public/private toggle, optimistic UI, reply threads, admin moderation — fully implemented. |
| 5 | ~~**Reading progress bar on post pages**~~ ✅ Done | Implemented at `top-16`, pale-blue gradient, `h-[3px]`. |
| 6 | **RSS / Atom feed** | Professional publications all have RSS. It enables syndication, shows up in feed readers, and is a strong credibility signal for a financial research platform. Cost: ~2 hours to implement. |
| 7 | ~~**Pagination on post list / category pages**~~ ✅ Done | Implemented with Supabase `.range()`, windowed `<Pagination>` component on all 5 category pages. |

---

### TIER 3 — Professional credibility and growth features

| # | Task | Why it matters |
|---|---|---|
| 8 | **Email newsletter / subscription** | For a thought-leadership platform, email subscribers are the highest-value audience. Resend is already configured and free up to 3,000 emails/month. Build a simple "Subscribe" form that collects email addresses and sends a welcome email. |
| 9 | **Full-text search with proper indexing** | The current search is basic keyword matching. Supabase supports `to_tsvector` + `websearch_to_tsquery` which enables true full-text search across titles, summaries, and content — essential when there are 20+ articles. |
| 10 | **Fix social share buttons** | The LinkedIn share button on post pages uses `window.location.href` which is empty on server render. Needs a client-side URL construction pattern. Also consider adding a Twitter/X share button. |
| 11 | **Admin analytics page** | To understand which articles perform, what categories attract the most readers, and where traffic comes from. The `page_views` and `post_views` tables already collect data — this is just building the chart UI. |
| 12 | **Dynamic Open Graph images** | When posts are shared on LinkedIn or Twitter, the preview card matters enormously for click-through rates. A simple dynamic OG image with the post title and category color on a navy background would significantly improve social sharing performance. |

---

### TIER 4 — Enhancement and differentiation

| # | Task | Why it matters |
|---|---|---|
| 13 | **Pre-generate AI translations** | Currently translations are generated on-demand for the first visitor. An admin button to pre-generate all locale translations before publishing eliminates that first-visitor latency. |
| 14 | ~~**Dark mode**~~ ✅ Done | Complete institutional system — next-themes, Sun/Moon toggle, 42 files updated, Bloomberg-style palette. |
| 15 | **Admin users page** | To view reader profiles, professional backgrounds, and interests. Helps shape content strategy. |
| 16 | **Bookmarking / saved posts** | Allows returning readers to build a personal reading list, increasing session depth and return visits. |

---

### TIER 5 — Advanced / Long-term

| # | Task | Notes |
|---|---|---|
| 17 | ~~**AI market brief pipeline**~~ ✅ Done | 9-agent weekly briefing system — GitHub Actions cron, Yahoo Finance + CoinGecko, GPT-4o-mini, QuickChart, Resend. Runs Mondays 22:00 UTC. |
| 18 | **Audience segmentation analytics** | Use `industry_types`, `country`, `interests` from profiles to understand who is reading what |
| 19 | **Recommendation engine** | Beyond same-category related posts — tag-similarity and reading history based |
| 20 | **Multi-author support** | Guest contributor accounts with limited admin access |
| 21 | **Premium content gating** | Selected articles behind login or paid access (Stripe integration) |

---

### Recommended sequence for the next two weeks

```
Week 1:  Deploy → publish 5 real articles → RSS feed → social share fix
Week 2:  Newsletter subscription form → full-text search → admin analytics page
```

This sequence transforms the site from a local prototype into a functioning professional blog with real readers, real content, and standard blog features — in two weeks of focused work.

---

*Last updated: 2026-05-14 (session 4)*
*Document maintained by: Claude Code (with Harry D. Hwang)*
*Update this file whenever major architectural changes are made.*
