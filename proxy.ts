import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  // Strip internal :3000 port added by Cloud Run standalone server
  if (url.port === '3000') url.port = ''
  // Use the public-facing host/proto from Cloudflare's forwarded headers
  // so locale redirects go to hdhmarketfrontier.com/en, not the .run.app URL
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedHost) url.hostname = forwardedHost.split(',')[0].trim()
  if (forwardedProto) url.protocol = forwardedProto.split(',')[0].trim() + ':'
  return intlMiddleware(new NextRequest(url, req))
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|admin|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
