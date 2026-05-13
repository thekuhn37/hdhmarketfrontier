'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const CONSENT_KEY = 'hdh_cookie_consent'

interface ConsentState {
  essential: boolean
  analytics: boolean
  functional: boolean
  decided: boolean
}

export default function CookieBanner() {
  const t = useTranslations('cookies')
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState<ConsentState>({
    essential: true,
    analytics: false,
    functional: false,
    decided: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) {
      setTimeout(() => setVisible(true), 1500)
    }
  }, [])

  const saveConsent = (consent: Omit<ConsentState, 'decided'>) => {
    const state = { ...consent, decided: true }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state))
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="rounded-2xl p-6 bg-white/95 dark:bg-[#1E2A3B]/95 backdrop-blur-xl border border-[#E5E7EB]/80 dark:border-white/10 shadow-[0_20px_60px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center flex-shrink-0">
                <Cookie size={16} className="text-[#0F172A] dark:text-[#38BDF8]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#111827] dark:text-slate-200 leading-relaxed">
                  {t('banner')}{' '}
                  <Link href="/cookie-policy" className="text-[#0EA5E9] dark:text-[#7DD3FC] hover:underline">
                    {t('learnMore')}
                  </Link>
                </p>
              </div>
            </div>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 space-y-3"
              >
                {/* Essential */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{t('essential')}</p>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400">{t('essentialDesc')}</p>
                  </div>
                  <div className="w-8 h-5 rounded-full bg-[#0F172A] dark:bg-[#38BDF8] flex items-center justify-end px-0.5 flex-shrink-0">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
                {/* Analytics */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{t('analytics')}</p>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400">{t('analyticsDesc')}</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                    className={`w-8 h-5 rounded-full transition-colors flex items-center flex-shrink-0 px-0.5 ${prefs.analytics ? 'bg-[#38BDF8] justify-end' : 'bg-[#E5E7EB] dark:bg-white/10 justify-start'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>
                {/* Functional */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{t('functional')}</p>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400">{t('functionalDesc')}</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, functional: !p.functional }))}
                    className={`w-8 h-5 rounded-full transition-colors flex items-center flex-shrink-0 px-0.5 ${prefs.functional ? 'bg-[#38BDF8] justify-end' : 'bg-[#E5E7EB] dark:bg-white/10 justify-start'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => saveConsent({ essential: true, analytics: true, functional: true })}
                className="w-full py-2.5 rounded-xl bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-sm font-semibold hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-colors"
              >
                {t('acceptAll')}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => saveConsent({ essential: true, analytics: false, functional: false })}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/15 text-[#4B5563] dark:text-slate-300 text-sm font-medium hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
                >
                  {t('rejectNonEssential')}
                </button>
                {showDetails ? (
                  <button
                    onClick={() => saveConsent(prefs)}
                    className="flex-1 py-2.5 rounded-xl border border-[#38BDF8] text-[#0EA5E9] dark:text-[#7DD3FC] text-sm font-medium hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={14} />
                    {t('save')}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDetails(true)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/15 text-[#4B5563] dark:text-slate-300 text-sm font-medium hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                  >
                    <Settings size={14} />
                    {t('managePreferences')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
