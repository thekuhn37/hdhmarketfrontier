import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import CategoryPageLayout from '@/components/posts/CategoryPageLayout'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return { title: t('markets.name'), description: t('markets.desc') }
}

export default async function MarketsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return (
    <CategoryPageLayout
      category="Markets"
      title={t('markets.name')}
      description={t('markets.desc')}
      locale={locale}
      accentColor="#0F172A"
    />
  )
}
