import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import CategoryPageLayout from '@/components/posts/CategoryPageLayout'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return { title: t('data.name'), description: t('data.desc') }
}

export default async function DataPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return (
    <CategoryPageLayout
      category="Data"
      title={t('data.name')}
      description={t('data.desc')}
      locale={locale}
      accentColor="#1E3A5F"
    />
  )
}
