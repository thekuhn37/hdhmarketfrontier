'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const getErrorMessage = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('NEXT_PUBLIC_SUPABASE')) {
      return 'Server not configured. Contact the administrator.'
    }
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('connect')) {
      return 'Cannot reach authentication service. Check your connection and try again.'
    }
    if (msg.includes('already registered') || msg.includes('User already registered')) {
      return 'This email is already registered. Please log in instead.'
    }
    if (msg.includes('Password should be') || msg.includes('password')) {
      return msg
    }
    if (msg.includes('Redirect URL not allowed')) {
      return 'Signup redirect URL is not configured in Supabase. Add http://localhost:3000/api/auth/callback to your Supabase Auth Redirect URLs.'
    }
    return msg || 'Signup failed. Please try again.'
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
        },
      })
      if (error) throw error
      toast.success('Check your email to confirm your account.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}` },
      })
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120] py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-navy flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-[#0F172A] dark:text-white text-lg">HDH Market Frontier</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-1">{t('signup')}</h1>
          <p className="text-[#6B7280] dark:text-slate-400 text-sm">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-[#0EA5E9] dark:text-[#7DD3FC] hover:underline font-medium">
              {t('login')}
            </Link>
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E2A3B] rounded-3xl border border-[#E5E7EB] dark:border-white/10 p-8 shadow-sm">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/15 text-[#111827] dark:text-slate-200 font-medium text-sm hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors mb-6"
          >
            <span className="text-base font-bold">G</span>
            {t('loginWithGoogle')}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-white/10" />
            <span className="text-xs text-[#6B7280] dark:text-slate-500">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-white/10" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('displayName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/15 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-slate-200 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/15 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-slate-200 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/15 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-slate-200 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-xl gradient-navy text-white font-semibold text-sm transition-all',
                loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
              )}
            >
              {loading ? 'Creating account...' : t('signupBtn')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B7280] dark:text-slate-400 mt-4">
          {t('termsAgree')}{' '}
          <Link href="/terms-of-use" className="hover:underline">Terms</Link>
          {' & '}
          <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
        </p>
      </motion.div>
    </div>
  )
}
