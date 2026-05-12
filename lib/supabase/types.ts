export type Locale = 'en' | 'ko' | 'zh'

export type PostStatus = 'draft' | 'published' | 'archived'
export type CommentStatus = 'pending' | 'approved' | 'hidden' | 'deleted'
export type ContactStatus = 'unread' | 'read' | 'archived'
export type UserRole = 'user' | 'admin'

// App-level types (may include joined/computed fields)
export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  provider: string | null
  country: string | null
  company: string | null
  job_title: string | null
  industry_types: string[]
  interests: string[]
  discovery_source: string | null
  privacy_consent: boolean
  analytics_consent: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  thumbnail_url: string | null
  category: string
  language: Locale
  translation_group_id: string | null
  status: PostStatus
  author_id: string
  source_url: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  reading_time: number
  view_count: number
  is_featured: boolean
  is_popular: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined fields (not actual DB columns)
  tags?: Tag[]
  author?: Profile
}

export interface PostTag {
  post_id: string
  tag_id: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  status: CommentStatus
  is_private: boolean
  parent_id: string | null
  created_at: string
  updated_at: string
  user?: Profile
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  organization: string | null
  subject: string
  message: string
  status: ContactStatus
  created_at: string
}

export interface PageView {
  id: string
  path: string
  user_id: string | null
  session_id: string | null
  referrer: string | null
  user_agent: string | null
  language: string | null
  created_at: string
}

export interface PostView {
  id: string
  post_id: string
  user_id: string | null
  session_id: string | null
  referrer: string | null
  duration_seconds: number | null
  created_at: string
}

export interface AIDraft {
  id: string
  title: string
  source_type: string
  source_url: string | null
  raw_data: Record<string, unknown> | null
  generated_summary: string | null
  generated_content: string | null
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  created_at: string
  updated_at: string
}

export interface PostTranslation {
  id: string
  post_id: string
  locale: string
  title: string
  summary: string | null
  content: string
  created_at: string
}

export interface CookieConsent {
  id: string
  user_id: string | null
  session_id: string | null
  essential: boolean
  analytics: boolean
  functional: boolean
  created_at: string
}

// Database type uses only actual DB columns (no joined fields)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: string
          provider: string | null
          country: string | null
          company: string | null
          job_title: string | null
          industry_types: string[]
          interests: string[]
          discovery_source: string | null
          privacy_consent: boolean
          analytics_consent: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          provider?: string | null
          country?: string | null
          company?: string | null
          job_title?: string | null
          industry_types?: string[]
          interests?: string[]
          discovery_source?: string | null
          privacy_consent?: boolean
          analytics_consent?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          provider?: string | null
          country?: string | null
          company?: string | null
          job_title?: string | null
          industry_types?: string[]
          interests?: string[]
          discovery_source?: string | null
          privacy_consent?: boolean
          analytics_consent?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          content: string
          thumbnail_url: string | null
          category: string
          language: string
          translation_group_id: string | null
          status: string
          author_id: string
          source_url: string | null
          seo_title: string | null
          seo_description: string | null
          og_image_url: string | null
          reading_time: number
          view_count: number
          is_featured: boolean
          is_popular: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          summary?: string | null
          content: string
          thumbnail_url?: string | null
          category: string
          language?: string
          translation_group_id?: string | null
          status?: string
          author_id: string
          source_url?: string | null
          seo_title?: string | null
          seo_description?: string | null
          og_image_url?: string | null
          reading_time?: number
          view_count?: number
          is_featured?: boolean
          is_popular?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          summary?: string | null
          content?: string
          thumbnail_url?: string | null
          category?: string
          language?: string
          translation_group_id?: string | null
          status?: string
          author_id?: string
          source_url?: string | null
          seo_title?: string | null
          seo_description?: string | null
          og_image_url?: string | null
          reading_time?: number
          view_count?: number
          is_featured?: boolean
          is_popular?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; created_at?: string }
        Relationships: []
      }
      post_tags: {
        Row: { post_id: string; tag_id: string }
        Insert: { post_id: string; tag_id: string }
        Update: { post_id?: string; tag_id?: string }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          status: string
          is_private: boolean
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          status?: string
          is_private?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          status?: string
          is_private?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          organization: string | null
          subject: string
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          organization?: string | null
          subject: string
          message: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          organization?: string | null
          subject?: string
          message?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          path: string
          user_id: string | null
          session_id: string | null
          referrer: string | null
          user_agent: string | null
          language: string | null
          created_at: string
        }
        Insert: {
          id?: string
          path: string
          user_id?: string | null
          session_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          language?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          path?: string
          user_id?: string | null
          session_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          language?: string | null
          created_at?: string
        }
        Relationships: []
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string | null
          session_id: string | null
          referrer: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id?: string | null
          session_id?: string | null
          referrer?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string | null
          session_id?: string | null
          referrer?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: []
      }
      ai_drafts: {
        Row: {
          id: string
          title: string
          source_type: string
          source_url: string | null
          raw_data: Record<string, unknown> | null
          generated_summary: string | null
          generated_content: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          source_type: string
          source_url?: string | null
          raw_data?: Record<string, unknown> | null
          generated_summary?: string | null
          generated_content?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          source_type?: string
          source_url?: string | null
          raw_data?: Record<string, unknown> | null
          generated_summary?: string | null
          generated_content?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_translations: {
        Row: {
          id: string
          post_id: string
          locale: string
          title: string
          summary: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          locale: string
          title: string
          summary?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          locale?: string
          title?: string
          summary?: string | null
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          essential: boolean
          analytics: boolean
          functional: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          essential?: boolean
          analytics?: boolean
          functional?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          essential?: boolean
          analytics?: boolean
          functional?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
