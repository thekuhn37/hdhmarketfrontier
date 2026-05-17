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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('homeTitle'),
    description: t('siteDesc'),
    openGraph: {
      title: t('homeTitle'),
      description: t('siteDesc'),
      images: [{ url: '/en/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/en/opengraph-image'],
    },
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  return (
    <>
      <HeroSection />
      <ThemeCards />
      <AboutSection />
      <FeaturedInsight locale={locale} />
      <LatestPosts locale={locale} />
      <PopularPosts locale={locale} />
      {/* <NewsletterSection /> */}
    </>
  )
}
