import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export default function proxy(req: NextRequest) {
  // Cloud Run routes external :443 → internal :3000. Strip the internal port
  // so locale redirects go to https://hostname/en instead of https://hostname:3000/en.
  const url = req.nextUrl.clone()
  if (url.port === '3000') url.port = ''
  return intlMiddleware(new NextRequest(url, req))
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|admin|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
