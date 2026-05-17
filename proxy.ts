import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!_next|_vercel|api|admin|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
