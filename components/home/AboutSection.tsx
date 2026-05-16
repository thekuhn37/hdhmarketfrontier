'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Globe, BarChart2, Network, BrainCircuit, Coins } from 'lucide-react'

const EXPERTISE = [
  { icon: BarChart2, label: 'Financial Markets' },
  { icon: Globe, label: 'Market Data' },
  { icon: Network, label: 'Market Infrastructure' },
  { icon: BrainCircuit, label: 'AI in Finance' },
  { icon: Coins, label: 'Digital Assets' },
]

export default function AboutSection() {
  const t = useTranslations('home')

  return (
    <section className="py-24 bg-white dark:bg-[#0B1120]">
      <div className="content-width">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Visual */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div
              className="relative rounded-3xl overflow-hidden h-96 gradient-navy flex items-center justify-center"
            >
              {/* Decorative grid */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Center headshot */}
              <div className="relative z-10 text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 mx-auto mb-4 shadow-xl">
                  <img
                    src="/images/headshot2.JPEG"
                    alt="Harry D. Hwang"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <p className="text-white/60 text-sm font-medium tracking-widest uppercase">Harry D. Hwang</p>
                <p className="text-white/40 text-xs mt-1">Financial Markets Professional</p>
              </div>
              {/* Floating expertise pills */}
              {EXPERTISE.map(({ icon: Icon, label }, i) => {
                const positions = [
                  'top-6 left-6', 'top-6 right-6', 'bottom-6 left-6',
                  'bottom-6 right-6', 'top-1/2 -translate-y-1/2 left-4',
                ]
                return (
                  <motion.div
                    key={label}
                    className={`absolute ${positions[i]} flex items-center gap-2`}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <Icon size={14} className="text-[#38BDF8]" />
                      <span className="text-white/80 text-xs font-medium">{label}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#38BDF8] uppercase tracking-wider mb-4">
              <span className="w-6 h-0.5 bg-[#38BDF8]" />
              About
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-6 tracking-tight">
              {t('aboutHarry')}
            </h2>
            <p className="text-[#4B5563] dark:text-slate-300 text-lg leading-relaxed mb-4">
              {t('aboutDesc')}
            </p>
            <p className="text-[#4B5563] dark:text-slate-400 leading-relaxed mb-8">
              {t('aboutTagline')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {EXPERTISE.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-[#0F172A] dark:bg-[#0F172A] flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-[#38BDF8]" />
                  </div>
                  <span className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] font-semibold text-sm hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-colors"
              >
                {t('aboutLink')} <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[#0F172A] dark:text-slate-200 font-semibold text-sm hover:border-[#38BDF8] dark:hover:border-[#38BDF8] transition-colors"
              >
                {t('contactLink')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
