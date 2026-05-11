'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success(t('loginSuccess'))
      router.push('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { toast.error(t('enterEmailFirst')); return }
    setResetLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
    })
    if (error) toast.error(error.message)
    else { toast.success(t('resetEmailSent')); setResetSent(true) }
    setResetLoading(false)
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-navy flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-[#0F172A] text-lg">HDH Market Frontier</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">{t('login')}</h1>
          <p className="text-[#6B7280] text-sm">
            {t('noAccount')}{' '}
            <Link href="/signup" className="text-[#0EA5E9] hover:underline font-medium">
              {t('signup')}
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] font-medium text-sm hover:bg-[#F8FAFC] transition-colors mb-6"
          >
            <span className="text-base font-bold">G</span>
            {t('loginWithGoogle')}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#6B7280]">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#111827]">{t('password')}</label>
                <button type="button" onClick={handleForgotPassword} disabled={resetLoading || resetSent} className="text-xs text-[#0EA5E9] hover:underline disabled:opacity-50">{resetSent ? t('resetEmailSent') : t('forgotPassword')}</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
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
              {loading ? 'Signing in...' : t('loginBtn')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B7280] mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms-of-use" className="hover:underline">Terms of Use</Link>
          {' '}and{' '}
          <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  )
}
