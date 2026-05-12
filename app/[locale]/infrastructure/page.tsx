import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import CategoryPageLayout from '@/components/posts/CategoryPageLayout'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return { title: t('infrastructure.name'), description: t('infrastructure.desc') }
}

export default async function InfrastructurePage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page } = await searchParams
  const t = await getTranslations({ locale, namespace: 'themes' })
  return (
    <CategoryPageLayout
      category="Infrastructure"
      title={t('infrastructure.name')}
      description={t('infrastructure.desc')}
      locale={locale}
      accentColor="#0369A1"
      page={page ? Math.max(1, parseInt(page, 10)) : 1}
    />
  )
}
