import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'
import ScrollToBottom from '@/components/layout/ScrollToBottom'
import ThemeProvider from '@/components/layout/ThemeProvider'
import CookieBanner from '@/components/ui/CookieBanner'
import { Toaster } from 'react-hot-toast'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })

  return {
    title: {
      default: t('siteTitle'),
      template: `%s | ${t('siteTitle')}`,
    },
    description: t('siteDesc'),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    openGraph: {
      siteName: t('siteTitle'),
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) notFound()

  const messages = await getMessages({ locale })

  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
        <ScrollToTop />
        <ScrollToBottom />
        <CookieBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#0F172A',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
