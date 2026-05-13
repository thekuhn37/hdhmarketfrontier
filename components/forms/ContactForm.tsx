'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations, useLocale } from 'next-intl'
import { Send, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Link } from '@/i18n/navigation'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  organization: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(10),
  consent: z.boolean().refine((v) => v, { message: 'Required' }),
})

type FormData = z.infer<typeof schema>

export default function ContactForm() {
  const t = useTranslations('contact')
  const locale = useLocale()
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const err = await res.json()
      alert(err.error || 'Something went wrong. Please try again.')
    }
  }

  const inputClass = (hasError?: boolean) => cn(
    'w-full px-4 py-3 rounded-xl border text-[#111827] dark:text-slate-200 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-sm transition-all',
    'focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent',
    hasError
      ? 'border-red-400 bg-red-50 dark:bg-red-500/10 dark:border-red-500/40'
      : 'border-[#E5E7EB] dark:border-white/15 bg-white dark:bg-[#0F172A] hover:border-[#94A3B8] dark:hover:border-white/25'
  )

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">{t('successTitle')}</h3>
        <p className="text-[#4B5563] dark:text-slate-300">{t('successDesc')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('name')} *</label>
          <input {...register('name')} className={inputClass(!!errors.name)} placeholder="Harry Hwang" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('email')} *</label>
          <input {...register('email')} type="email" className={inputClass(!!errors.email)} placeholder="you@company.com" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{t('invalidEmail')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('organization')}</label>
        <input {...register('organization')} className={inputClass()} placeholder="Your company or institution" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('subject')} *</label>
        <input {...register('subject')} className={inputClass(!!errors.subject)} placeholder="Research collaboration, speaking, etc." />
        {errors.subject && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1.5">{t('message')} *</label>
        <textarea
          {...register('message')}
          rows={6}
          className={cn(inputClass(!!errors.message), 'resize-y')}
          placeholder="Please describe your inquiry in detail..."
        />
        {errors.message && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          {...register('consent')}
          id="consent"
          className="mt-0.5 w-4 h-4 accent-[#0F172A] rounded"
        />
        <label htmlFor="consent" className="text-sm text-[#4B5563] dark:text-slate-300 leading-relaxed">
          {t('consent')}{' '}
          <Link href="/privacy-policy" className="text-[#0EA5E9] dark:text-[#7DD3FC] hover:underline" target="_blank">
            Privacy Policy
          </Link>
        </label>
      </div>
      {errors.consent && <p className="text-xs text-red-500">{t('consentRequired')}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-navy text-white font-semibold text-sm transition-all',
          isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
        )}
      >
        <Send size={16} />
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
