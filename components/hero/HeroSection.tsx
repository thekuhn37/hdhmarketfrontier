'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import dynamic from 'next/dynamic'

const HeroAnimation = dynamic(() => import('./HeroAnimation'), { ssr: false })

export default function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* Animated canvas background */}
      <div className="absolute inset-0 opacity-70">
        <HeroAnimation />
      </div>

      {/* Subtle gradient overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(56,189,248,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(30,58,95,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 10% 60%, rgba(15,23,42,0.04) 0%, transparent 50%)
          `
        }}
      />

      {/* Three-column layout: side cards | center content | side cards
          Cards only render on xl+ (≥1280px) where side margins are wide enough */}
      <div className="relative z-10 w-full flex items-center justify-center py-32 px-4">

        {/* Left floating cards — xl+ only */}
        <div className="hidden xl:flex flex-col gap-5 w-44 flex-shrink-0 mx-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="animate-float"
          >
            <div
              className="px-5 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center">
                  <span className="text-[#38BDF8] text-xs font-bold">▲</span>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] font-medium">Market Data</div>
                  <div className="text-sm text-[#0F172A] font-semibold">Infrastructure</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="animate-float-slow"
          >
            <div
              className="px-5 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FS</span>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] font-medium">Global Markets</div>
                  <div className="text-sm text-[#0F172A] font-semibold">Strategy</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center content */}
        <div className="flex-1 min-w-0 text-center max-w-3xl">
          {/* Category pill */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#1E3A5F] text-xs font-semibold tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
              Professional Insight Platform
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-gradient">{t('title')}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl font-medium text-[#1E3A5F] mb-6 tracking-tight"
          >
            {t('subtitle')}
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base md:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed mb-12"
          >
            {t('description')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/markets"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#0F172A] text-white font-semibold text-base hover:bg-[#1E3A5F] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {t('ctaPrimary')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border border-[#E5E7EB] text-[#0F172A] font-semibold text-base hover:border-[#38BDF8] hover:text-[#1E3A5F] transition-all duration-200"
            >
              {t('ctaSecondary')}
            </Link>
          </motion.div>
        </div>

        {/* Right floating card — xl+ only */}
        <div className="hidden xl:flex flex-col items-start justify-center w-44 flex-shrink-0 mx-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="animate-float-delayed"
          >
            <div
              className="px-5 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] font-medium">Digital Assets</div>
                  <div className="text-sm text-[#0F172A] font-semibold">Tokenization</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#6B7280]"
      >
        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  )
}
