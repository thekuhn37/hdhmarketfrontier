import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Server Actions CSRF protection — list every host the app can be accessed from.
// Using an env var keeps this correct across staging/prod without code changes.
const serverActionOrigins = [
  'localhost:3000',
  'localhost:3001',
  'hdhmarketfrontier.com',
  'www.hdhmarketfrontier.com',
]
if (process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL).host
    if (!serverActionOrigins.includes(host)) serverActionOrigins.push(host)
  } catch {}
}

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '**': ['./node_modules/@swc/helpers/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: serverActionOrigins },
  },
}

export default withNextIntl(nextConfig)
