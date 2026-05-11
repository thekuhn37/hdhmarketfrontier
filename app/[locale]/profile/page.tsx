'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User, Mail, Building2, Briefcase, Globe, ShieldCheck,
  Lock, Trash2, Check, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Profile } from '@/lib/supabase/types'

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

function SectionCard({ title, icon, children, defaultOpen = true }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#0EA5E9]">{icon}</span>
          <span className="font-semibold text-[#0F172A] text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-[#9CA3AF]" /> : <ChevronDown size={16} className="text-[#9CA3AF]" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-[#F1F5F9]">{children}</div>}
    </div>
  )
}

function MultiCheckbox({ options, selected, onChange }: {
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
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all',
            selected.includes(opt)
              ? 'border-[#0EA5E9] bg-[#F0F9FF] text-[#0369A1] font-medium'
              : 'border-[#E5E7EB] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
          )}
        >
          <span className={cn(
            'w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center',
            selected.includes(opt) ? 'bg-[#0EA5E9] border-[#0EA5E9]' : 'border-[#D1D5DB]'
          )}>
            {selected.includes(opt) && <Check size={9} className="text-white" />}
          </span>
          {opt}
        </button>
      ))}
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[#F1F5F9] last:border-0">
      <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide w-32 flex-shrink-0">{label}</span>
      <span className="text-sm text-[#111827] text-right">{value}</span>
    </div>
  )
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const locale = useLocale()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEmailProvider, setIsEmailProvider] = useState(false)

  // Personal info form
  const [displayName, setDisplayName] = useState('')
  const [country, setCountry] = useState('')
  const [savingPersonal, setSavingPersonal] = useState(false)

  // Professional form
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [industryTypes, setIndustryTypes] = useState<string[]>([])
  const [savingProfessional, setSavingProfessional] = useState(false)

  // Interests form
  const [interests, setInterests] = useState<string[]>([])
  const [discoverySource, setDiscoverySource] = useState('')
  const [savingInterests, setSavingInterests] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)

  // Consent form
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)

  // Delete account modal
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsRecovery(params.get('recovery') === 'true')
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const provider = user.app_metadata?.provider || 'email'
      setIsEmailProvider(provider === 'email')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        const p = data as unknown as Profile
        setProfile(p)
        setDisplayName(p.display_name || '')
        setCountry(p.country || '')
        setCompany(p.company || '')
        setJobTitle(p.job_title || '')
        setIndustryTypes(p.industry_types || [])
        setInterests(p.interests || [])
        setDiscoverySource(p.discovery_source || '')
        setPrivacyConsent(p.privacy_consent || false)
        setAnalyticsConsent(p.analytics_consent || false)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const savePersonal = async () => {
    if (!profile) return
    setSavingPersonal(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      country: country || null,
    }).eq('id', profile.id)
    if (error) toast.error('Failed to save')
    else { toast.success(t('profileUpdated')); setProfile(p => p ? { ...p, display_name: displayName, country } : p) }
    setSavingPersonal(false)
  }

  const saveProfessional = async () => {
    if (!profile) return
    setSavingProfessional(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      company: company.trim() || null,
      job_title: jobTitle.trim() || null,
      industry_types: industryTypes,
    }).eq('id', profile.id)
    if (error) toast.error('Failed to save')
    else toast.success(t('profileUpdated'))
    setSavingProfessional(false)
  }

  const saveInterests = async () => {
    if (!profile) return
    setSavingInterests(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      interests,
      discovery_source: discoverySource || null,
    }).eq('id', profile.id)
    if (error) toast.error('Failed to save')
    else toast.success(t('profileUpdated'))
    setSavingInterests(false)
  }

  const savePassword = async () => {
    if (newPassword.length < 8) { toast.error(t('passwordTooShort')); return }
    if (newPassword !== confirmPassword) { toast.error(t('passwordMismatch')); return }
    setSavingPassword(true)
    const supabase = createClient()
    if (!isRecovery) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: currentPassword,
      })
      if (signInError) {
        toast.error(t('wrongCurrentPassword'))
        setSavingPassword(false)
        return
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else {
      toast.success(t('passwordUpdated'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  const sendResetEmail = async () => {
    if (!profile) return
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
    })
    if (error) toast.error(error.message)
    else { toast.success(t('resetEmailSent')); setResetSent(true) }
  }

  const saveConsent = async () => {
    if (!profile) return
    setSavingConsent(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      privacy_consent: privacyConsent,
      analytics_consent: analyticsConsent,
    }).eq('id', profile.id)
    if (error) toast.error('Failed to save')
    else toast.success(t('consentUpdated'))
    setSavingConsent(false)
  }

  const deleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to delete account')
      router.push('/')
    } catch {
      toast.error('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-6 h-6 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const initials = (profile.display_name || profile.email || 'U')[0].toUpperCase()
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const providerLabel = profile.provider === 'google' ? t('providerGoogle') : t('providerEmail')

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Page header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('title')}</h1>
          <Link href="/" className="text-sm text-[#6B7280] hover:text-[#0F172A] transition-colors">
            ← {t('backToSite')}
          </Link>
        </div>

        {/* Onboarding banner */}
        {!profile.onboarding_completed && (
          <div className="flex items-center justify-between gap-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[#0369A1]">{t('completeOnboarding')}</p>
              <p className="text-xs text-[#0EA5E9] mt-0.5">{t('onboardingBannerDesc')}</p>
            </div>
            <Link
              href="/onboarding"
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#0EA5E9] text-white text-sm font-medium hover:bg-[#0284C7] transition-colors"
            >
              {t('completeNow')}
            </Link>
          </div>
        )}

        {/* 1. Account Overview */}
        <SectionCard title={t('accountOverview')} icon={<User size={16} />}>
          <div className="pt-4">
            <div className="flex items-center gap-4 mb-5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full gradient-navy flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold">{initials}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-[#0F172A]">{profile.display_name || profile.email}</p>
                <p className="text-sm text-[#6B7280]">{profile.email}</p>
                <span className={cn(
                  'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                  profile.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-[#F1F5F9] text-[#475569]'
                )}>
                  {profile.role}
                </span>
              </div>
            </div>
            <FieldRow label={t('joinedOn')} value={joinedDate} />
            <FieldRow label={t('provider')} value={providerLabel} />
          </div>
        </SectionCard>

        {/* 2. Personal Information */}
        <SectionCard title={t('personalInfo')} icon={<Globe size={16} />}>
          <div className="pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t('notSet')}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('country')}</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
              >
                <option value="">{t('selectCountry')}</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                <span className="flex items-center gap-1.5"><Mail size={13} /> Email</span>
              </label>
              <input
                value={profile.email}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm bg-[#F8FAFC] text-[#6B7280] cursor-not-allowed"
              />
            </div>
            <button
              onClick={savePersonal}
              disabled={savingPersonal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {savingPersonal ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              {savingPersonal ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </SectionCard>

        {/* 3. Professional Profile */}
        <SectionCard title={t('professionalProfile')} icon={<Building2 size={16} />}>
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('company')}</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder={t('notSet')}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('jobTitle')}</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder={t('notSet')}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">{t('industryTypes')}</label>
              <p className="text-xs text-[#6B7280] mb-2">{t('industryTypesDesc')}</p>
              <MultiCheckbox options={INDUSTRY_OPTIONS} selected={industryTypes} onChange={setIndustryTypes} />
            </div>
            <button
              onClick={saveProfessional}
              disabled={savingProfessional}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {savingProfessional ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              {savingProfessional ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </SectionCard>

        {/* 4. Interests */}
        <SectionCard title={t('interestsSection')} icon={<Briefcase size={16} />}>
          <div className="pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">{t('mainInterests')}</label>
              <p className="text-xs text-[#6B7280] mb-2">{t('mainInterestsDesc')}</p>
              <MultiCheckbox options={INTEREST_OPTIONS} selected={interests} onChange={setInterests} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('discoverySource')}</label>
              <select
                value={discoverySource}
                onChange={e => setDiscoverySource(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
              >
                <option value="">{t('selectDiscovery')}</option>
                {DISCOVERY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button
              onClick={saveInterests}
              disabled={savingInterests}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {savingInterests ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              {savingInterests ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </SectionCard>

        {/* 5. Security (email users only) */}
        {isEmailProvider && (
          <SectionCard title={t('security')} icon={<Lock size={16} />} defaultOpen={false}>
            <div className="pt-4 space-y-4">
              {!isRecovery && (
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('currentPassword')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={savePassword}
                  disabled={savingPassword || !newPassword || (!isRecovery && !currentPassword)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {savingPassword ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={14} />}
                  {savingPassword ? t('updating') : t('updatePassword')}
                </button>
                {!isRecovery && (
                  <button
                    onClick={sendResetEmail}
                    disabled={resetSent}
                    className="text-sm text-[#0EA5E9] hover:underline disabled:opacity-50"
                  >
                    {resetSent ? t('resetEmailSent') : t('forgotPassword')}
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        )}

        {/* 6. Privacy & Consent */}
        <SectionCard title={t('privacyConsent')} icon={<ShieldCheck size={16} />} defaultOpen={false}>
          <div className="pt-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={e => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-[#0EA5E9] focus:ring-[#38BDF8]"
              />
              <div>
                <p className="text-sm font-medium text-[#111827]">{t('privacyConsentLabel')}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{t('privacyConsentDesc')}</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analyticsConsent}
                onChange={e => setAnalyticsConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-[#0EA5E9] focus:ring-[#38BDF8]"
              />
              <div>
                <p className="text-sm font-medium text-[#111827]">{t('analyticsConsentLabel')}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{t('analyticsConsentDesc')}</p>
              </div>
            </label>
            <button
              onClick={saveConsent}
              disabled={savingConsent}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {savingConsent ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              {savingConsent ? t('saving') : t('saveConsent')}
            </button>
          </div>
        </SectionCard>

        {/* 7. Danger Zone */}
        <SectionCard title={t('dangerZone')} icon={<Trash2 size={16} />} defaultOpen={false}>
          <div className="pt-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">{t('deleteAccount')}</p>
              <p className="text-xs text-red-600 mb-3">{t('deleteAccountDesc')}</p>
              <button
                onClick={() => setDeleteOpen(true)}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                {t('deleteAccountBtn')}
              </button>
            </div>
          </div>
        </SectionCard>

      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">{t('deleteAccount')}</h2>
              <button onClick={() => { setDeleteOpen(false); setDeleteConfirmText('') }}>
                <X size={18} className="text-[#9CA3AF] hover:text-[#374151]" />
              </button>
            </div>
            <p className="text-sm text-[#6B7280] mb-4">{t('deleteAccountWarning')}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('deleteAccountConfirmLabel')}</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={t('deleteAccountConfirmPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setDeleteOpen(false); setDeleteConfirmText('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F8FAFC] transition-colors"
              >
                {t('deleteAccountCancel')}
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : t('deleteAccountConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
