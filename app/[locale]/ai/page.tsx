import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import CategoryPageLayout from '@/components/posts/CategoryPageLayout'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return { title: t('ai.name'), description: t('ai.desc') }
}

export default async function AIPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return (
    <CategoryPageLayout
      category="AI"
      title={t('ai.name')}
      description={t('ai.desc')}
      locale={locale}
      accentColor="#7C3AED"
    />
  )
}
