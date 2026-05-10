import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hdhmarketfrontier.com'
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

  // Sample post slugs - in production these come from Supabase
  const sampleSlugs = [
    'understanding-market-structure',
    'why-market-data-strategy-matters',
    'hidden-infrastructure-financial-markets',
    'ai-use-cases-financial-data-governance',
    'tokenization-future-market-infrastructure',
  ]

  const postPages = locales.flatMap(locale =>
    sampleSlugs.map(slug => ({
      url: `${siteUrl}/${locale}/posts/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as 'monthly',
      priority: 0.7,
    }))
  )

  return [...staticPages, ...postPages]
}
