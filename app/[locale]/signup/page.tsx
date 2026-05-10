'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
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
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      toast.success('Check your email to confirm your account.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
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
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-navy flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-[#0F172A] text-lg">HDH Market Frontier</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">{t('signup')}</h1>
          <p className="text-[#6B7280] text-sm">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-[#0EA5E9] hover:underline font-medium">
              {t('login')}
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm">
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('displayName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">{t('password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
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

        <p className="text-center text-xs text-[#6B7280] mt-4">
          {t('termsAgree')}{' '}
          <Link href="/terms-of-use" className="hover:underline">Terms</Link>
          {' & '}
          <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
        </p>
      </motion.div>
    </div>
  )
}
