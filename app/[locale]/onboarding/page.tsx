'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada',
  'China', 'Colombia', 'Czech Republic', 'Denmark', 'Finland', 'France',
  'Germany', 'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia',
  'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Luxembourg', 'Malaysia',
  'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Poland',
  'Portugal', 'Romania', 'Saudi Arabia', 'Singapore', 'South Africa',
  'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand',
  'Turkey', 'UAE', 'United Kingdom', 'United States', 'Vietnam', 'Other',
]

const INDUSTRY_OPTIONS = [
  'Exchange', 'Broker / Dealer', 'Trading Firm', 'Asset Management',
  'Hedge Fund', 'Quantitative Research', 'HFT / Proprietary Trading', 'Bank',
  'Government / Regulator', 'Fintech', 'Data Vendor', 'Market Infrastructure',
  'Technology Provider', 'Academic / Research', 'Consulting',
  'Service Provider', 'Media / Research', 'Retail Investor', 'Student', 'Other',
]

const INTEREST_OPTIONS = [
  'Markets', 'Market Structure', 'Market Data', 'Infrastructure', 'AI',
  'Digital Assets', 'Tokenization', 'Regulation', 'Quant Trading',
  'Data Strategy', 'Exchange Technology', 'Fintech', 'Research', 'Other',
]

const DISCOVERY_OPTIONS = [
  'Google Search', 'LinkedIn', 'Referral', 'Conference / Event',
  'Social Media', 'GitHub', 'Article / Blog', 'Word of Mouth', 'Other',
]

interface FormData {
  display_name: string
  country: string
  privacy_consent: boolean
  analytics_consent: boolean
  company: string
  job_title: string
  industry_types: string[]
  interests: string[]
  discovery_source: string
}

function MultiCheckbox({
  options, selected, onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
            selected.includes(opt)
              ? 'border-[#0EA5E9] bg-[#F0F9FF] text-[#0369A1] font-medium'
              : 'border-[#E5E7EB] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
          )}
        >
          <span className={cn(
            'w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center',
            selected.includes(opt) ? 'bg-[#0EA5E9] border-[#0EA5E9]' : 'border-[#D1D5DB]'
          )}>
            {selected.includes(opt) && <Check size={10} className="text-white" />}
          </span>
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    display_name: '',
    country: '',
    privacy_consent: false,
    analytics_consent: false,
    company: '',
    job_title: '',
    industry_types: [],
    interests: [],
    discovery_source: '',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, country, company, job_title, industry_types, interests, discovery_source, privacy_consent, analytics_consent, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_completed) {
          router.push('/')
          return
        }

        if (profile) {
          setForm(prev => ({
            ...prev,
            display_name: profile.display_name || '',
            country: profile.country || '',
            company: profile.company || '',
            job_title: profile.job_title || '',
            industry_types: profile.industry_types || [],
            interests: profile.interests || [],
            discovery_source: profile.discovery_source || '',
            privacy_consent: profile.privacy_consent || false,
            analytics_consent: profile.analytics_consent || false,
          }))
        }
      } catch {
        toast.error('Failed to load profile. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const validateStep1 = () => {
    if (!form.display_name.trim()) { toast.error(t('displayNameRequired')); return false }
    if (!form.country) { toast.error(t('countryRequired')); return false }
    if (!form.privacy_consent) { toast.error(t('privacyConsentRequired')); return false }
    return true
  }

  const handleContinue = () => {
    if (step === 1 && !validateStep1()) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (completed: boolean) => {
    if (!userId) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({
        display_name: form.display_name.trim() || null,
        country: form.country || null,
        privacy_consent: form.privacy_consent,
        analytics_consent: form.analytics_consent,
        company: form.company.trim() || null,
        job_title: form.job_title.trim() || null,
        industry_types: form.industry_types,
        interests: form.interests,
        discovery_source: form.discovery_source || null,
        onboarding_completed: completed,
      }).eq('id', userId)

      if (error) throw error
      router.push('/')
    } catch {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-6 h-6 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-start justify-center pt-8 pb-16 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-navy flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-[#0F172A] text-lg">HDH Market Frontier</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">{t('title')}</h1>
          <p className="text-[#6B7280] text-sm">{t('subtitle')}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                s === step ? 'gradient-navy text-white' :
                s < step ? 'bg-[#0EA5E9] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
              )}>
                {s < step ? <Check size={12} /> : s}
              </div>
              {s < 2 && <div className={cn('w-12 h-px', step > 1 ? 'bg-[#0EA5E9]' : 'bg-[#E5E7EB]')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-[#0F172A]">{t('step1Title')}</h2>
                  <p className="text-sm text-[#6B7280] mt-0.5">{t('step1Desc')}</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">
                    {t('displayName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                    placeholder={t('displayNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">
                    {t('country')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
                  >
                    <option value="">{t('selectCountry')}</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Consents */}
                <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.privacy_consent}
                      onChange={e => setForm(f => ({ ...f, privacy_consent: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-[#0EA5E9] focus:ring-[#38BDF8]"
                    />
                    <span className="text-sm text-[#374151]">
                      {t('privacyConsent')}{' '}
                      <Link href="/privacy-policy" className="text-[#0EA5E9] hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                      {' '}<span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.analytics_consent}
                      onChange={e => setForm(f => ({ ...f, analytics_consent: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-[#0EA5E9] focus:ring-[#38BDF8]"
                    />
                    <span className="text-sm text-[#374151]">{t('analyticsConsent')}</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-navy text-white font-semibold text-sm hover:opacity-90 transition-all"
                >
                  {t('continueBtn')} <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-[#0F172A]">{t('step2Title')}</h2>
                  <p className="text-sm text-[#6B7280] mt-0.5">{t('step2Desc')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('company')}</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      placeholder={t('companyPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('jobTitle')}</label>
                    <input
                      type="text"
                      value={form.job_title}
                      onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                      placeholder={t('jobTitlePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">{t('industryType')}</label>
                  <p className="text-xs text-[#6B7280] mb-2">{t('industryTypeDesc')}</p>
                  <MultiCheckbox
                    options={INDUSTRY_OPTIONS}
                    selected={form.industry_types}
                    onChange={v => setForm(f => ({ ...f, industry_types: v }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">{t('mainInterests')}</label>
                  <p className="text-xs text-[#6B7280] mb-2">{t('mainInterestsDesc')}</p>
                  <MultiCheckbox
                    options={INTEREST_OPTIONS}
                    selected={form.interests}
                    onChange={v => setForm(f => ({ ...f, interests: v }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('discoverySource')}</label>
                  <select
                    value={form.discovery_source}
                    onChange={e => setForm(f => ({ ...f, discovery_source: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
                  >
                    <option value="">{t('selectDiscovery')}</option>
                    {DISCOVERY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#4B5563] hover:bg-[#F8FAFC] transition-all"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={saving}
                    className="text-sm text-[#6B7280] hover:text-[#374151] transition-colors px-3 py-3"
                  >
                    {t('skipBtn')}
                  </button>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-navy text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {t('finishBtn')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
