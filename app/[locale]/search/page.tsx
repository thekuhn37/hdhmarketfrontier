import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return { title: t('searchTitle') }
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q = '', category = '' } = await searchParams
  const t = await getTranslations({ locale, namespace: 'search' })

  return (
    <div className="bg-white min-h-screen">
      <section className="gradient-navy py-20">
        <div className="content-width">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{t('title')}</h1>
          <p className="text-white/60">Search across all articles, categories, and topics</p>
        </div>
      </section>
      <section className="py-16">
        <div className="content-width">
          <Suspense fallback={<div>Loading...</div>}>
            <SearchClient initialQuery={q} initialCategory={category} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
