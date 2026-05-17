import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const siteUrl = 'https://hdhmarketfrontier.com'
const locales = ['en', 'ko', 'zh']

const STATIC_ROUTES = [
  '', '/about', '/contact', '/markets', '/data', '/infrastructure',
  '/ai', '/digital-assets', '/search', '/privacy-policy', '/cookie-policy', '/terms-of-use',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = locales.flatMap(locale =>
    STATIC_ROUTES.map(route => ({
      url: `${siteUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly' as 'daily' | 'weekly',
      priority: route === '' ? 1.0 : 0.8,
    }))
  )

  let postPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createAdminClient()
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, language, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (posts && posts.length > 0) {
      postPages = posts.map(post => ({
        url: `${siteUrl}/${post.language}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'monthly' as 'monthly',
        priority: 0.7,
      }))
    }
  } catch {
    // If DB is unreachable, sitemap still works for static pages
  }

  return [...staticPages, ...postPages]
}
