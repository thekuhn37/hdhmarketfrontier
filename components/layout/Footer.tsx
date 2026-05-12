import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Mail, ExternalLink } from 'lucide-react'
import FooterAdminLink from './FooterAdminLink'

export default function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const year = new Date().getFullYear()

  const exploreLinks = [
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

      {/* Accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent" />

      {/* Main content */}
      <div className="content-width pt-80 pb-60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand — spans 6 of 12 */}
          <div className="md:col-span-6">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                HDH<span className="text-[#38BDF8]"> Market</span> Frontier
              </span>
            </Link>
            <p className="text-white/55 text-sm leading-relaxed max-w-sm mb-8">
              {t('description')}
            </p>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] max-w-sm mb-8">
              <p className="text-white/40 text-xs leading-relaxed">
                {t('disclaimer')}
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/70 hover:text-white text-sm font-medium transition-all duration-200"
                aria-label={t('linkedin')}
              >
                <span className="text-xs font-bold">in</span>
                LinkedIn
                <ExternalLink size={11} className="opacity-50" />
              </a>
              <Link
                href="/contact"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/70 hover:text-white text-sm font-medium transition-all duration-200"
              >
                <Mail size={14} />
                Contact
              </Link>
            </div>
          </div>

          {/* Spacer — 1 col */}
          <div className="hidden md:block md:col-span-1" />

          {/* Explore — spans 5 of 12, displayed as 2 columns */}
          <div className="md:col-span-5">
            <h4 className="text-white/40 font-semibold text-xs uppercase tracking-widest mb-5">
              Explore
            </h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
              {exploreLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-white/55 hover:text-white text-sm transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <FooterAdminLink />
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.08]">
        <div className="content-width pt-10 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs">
            {t('copyright', { year })}
          </p>
          <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-end">
            {legalLinks.map(({ label, href }, i) => (
              <span key={href} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/20 text-xs">·</span>}
                <Link
                  href={href}
                  className="text-white/35 hover:text-white/70 text-xs transition-colors duration-150"
                >
                  {label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}