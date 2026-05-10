'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { TrendingUp, Database, Cpu, Coins, Server } from 'lucide-react'

const THEMES = [
  {
    key: 'markets',
    href: '/markets',
    icon: TrendingUp,
    iconBg: 'bg-[#0F172A]',
    iconColor: 'text-white',
    accent: '#0F172A',
    border: 'hover:border-[#0F172A]/30',
  },
  {
    key: 'data',
    href: '/data',
    icon: Database,
    iconBg: 'bg-[#1E3A5F]',
    iconColor: 'text-white',
    accent: '#1E3A5F',
    border: 'hover:border-[#1E3A5F]/30',
  },
  {
    key: 'infrastructure',
    href: '/infrastructure',
    icon: Server,
    iconBg: 'bg-[#0369A1]',
    iconColor: 'text-white',
    accent: '#0369A1',
    border: 'hover:border-[#0369A1]/30',
  },
  {
    key: 'ai',
    href: '/ai',
    icon: Cpu,
    iconBg: 'bg-[#7C3AED]',
    iconColor: 'text-white',
    accent: '#7C3AED',
    border: 'hover:border-[#7C3AED]/30',
  },
  {
    key: 'digitalAssets',
    href: '/digital-assets',
    icon: Coins,
    iconBg: 'bg-[#059669]',
    iconColor: 'text-white',
    accent: '#059669',
    border: 'hover:border-[#059669]/30',
  },
]

export default function ThemeCards() {
  const t = useTranslations('home')
  const tThemes = useTranslations('themes')

  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="content-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4 tracking-tight">
            {t('coreThemes')}
          </h2>
          <p className="text-[#4B5563] text-lg max-w-2xl mx-auto">{t('coreThemesDesc')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {THEMES.map(({ key, href, icon: Icon, iconBg, iconColor, accent, border }, i) => {
            const themeKey = key as 'markets' | 'data' | 'infrastructure' | 'ai' | 'digitalAssets'
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  href={href}
                  className={`group flex flex-col p-6 rounded-2xl bg-white border border-[#E5E7EB] ${border} hover:shadow-lg transition-all duration-300 h-full`}
                >
                  <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={22} className={iconColor} />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-2 group-hover:text-[#1E3A5F] transition-colors">
                    {tThemes(`${themeKey}.name`)}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed flex-1">
                    {tThemes(`${themeKey}.desc`)}
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
                      Explore →
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
