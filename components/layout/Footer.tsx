import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Mail, ExternalLink } from 'lucide-react'

export default function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const year = new Date().getFullYear()

  const mainLinks = [
    { label: tNav('home'), href: '/' },
    { label: tNav('about'), href: '/about' },
    { label: tNav('markets'), href: '/markets' },
    { label: tNav('data'), href: '/data' },
    { label: 'Infrastructure', href: '/infrastructure' },
    { label: tNav('ai'), href: '/ai' },
    { label: tNav('digitalAssets'), href: '/digital-assets' },
    { label: tNav('contact'), href: '/contact' },
  ]

  const legalLinks = [
    { label: t('privacyPolicy'), href: '/privacy-policy' },
    { label: t('cookiePolicy'), href: '/cookie-policy' },
    { label: t('termsOfUse'), href: '/terms-of-use' },
  ]

  return (
    <footer className="bg-[#0F172A] text-white mt-auto">
      <div className="content-width py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                HDH<span className="text-[#38BDF8]"> Market</span> Frontier
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              {t('description')}
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm transition-all"
                aria-label={t('linkedin')}
              >
                <span className="text-xs font-bold">in</span>
                LinkedIn
                <ExternalLink size={12} className="opacity-60" />
              </a>
              <a
                href="mailto:contact@hdhmarketfrontier.com"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm transition-all"
                aria-label={t('email')}
              >
                <Mail size={15} />
                Email
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider opacity-60">
              Explore
            </h4>
            <ul className="space-y-2">
              {mainLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider opacity-60">
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/40 text-xs leading-relaxed">
                {t('disclaimer')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs">
            {t('copyright', { year })}
          </p>
          <p className="text-white/30 text-xs">
            Built with Next.js · Hosted on Google Cloud Run
          </p>
        </div>
      </div>
    </footer>
  )
}
