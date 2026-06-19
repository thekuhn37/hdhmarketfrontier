import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import CategoryPageLayout from '@/components/posts/CategoryPageLayout'

// CategoryPageLayout reads request cookies via the Supabase server client, so
// this route must render dynamically rather than be statically prerendered.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'themes' })
  return { title: t('data.name'), description: t('data.desc') }
}

export default async function DataPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page } = await searchParams
  const t = await getTranslations({ locale, namespace: 'themes' })
  return (
    <CategoryPageLayout
      category="Data"
      title={t('data.name')}
      description={t('data.desc')}
      locale={locale}
      accentColor="#1E3A5F"
      page={page ? Math.max(1, parseInt(page, 10)) : 1}
    />
  )
}
