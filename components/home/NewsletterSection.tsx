'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Mail, ArrowRight } from 'lucide-react'

export default function NewsletterSection() {
  const t = useTranslations('home')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <section className="py-24 bg-[#0F172A]">
      <div className="content-width">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
            <Mail size={22} className="text-[#38BDF8]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            {t('newsletter')}
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            {t('newsletterDesc')}
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-white/10 border border-white/20"
            >
              <p className="text-white font-semibold text-lg">Thank you for subscribing!</p>
              <p className="text-white/60 text-sm mt-1">You'll receive the latest insights directly in your inbox.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletterPlaceholder')}
                required
                className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-sm"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#38BDF8] text-[#0F172A] font-semibold text-sm hover:bg-white transition-colors"
              >
                {t('newsletterBtn')} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="text-white/30 text-xs mt-4">{t('newsletterNote')}</p>
        </motion.div>
      </div>
    </section>
  )
}
