import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import HeroSection from '@/components/hero/HeroSection'
import ThemeCards from '@/components/home/ThemeCards'
import LatestPosts from '@/components/home/LatestPosts'
import PopularPosts from '@/components/home/PopularPosts'
import FeaturedInsight from '@/components/home/FeaturedInsight'
import AboutSection from '@/components/home/AboutSection'
// import NewsletterSection from '@/components/home/NewsletterSection'

interface Props {
  params: Promise<{ locale: string }>
}

// FeaturedInsight/LatestPosts/PopularPosts are server components that read
// request cookies through the Supabase server client, so this route must
// render dynamically rather than be statically prerendered.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('homeTitle'),
    description: t('siteDesc'),
    openGraph: {
      title: t('homeTitle'),
      description: t('siteDesc'),
      images: [{ url: 'https://hdhmarketfrontier.com/images/harry-hwang.jpg', width: 800, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://hdhmarketfrontier.com/images/harry-hwang.jpg'],
    },
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  return (
    <>
      <HeroSection />
      <ThemeCards />
      <FeaturedInsight locale={locale} />
      <AboutSection />
      <LatestPosts locale={locale} />
      <PopularPosts locale={locale} />
      {/* <NewsletterSection /> */}
    </>
  )
}
