import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import { Mail, Clock } from 'lucide-react'
import ContactForm from '@/components/forms/ContactForm'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return { title: t('contactTitle') }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })

  return (
    <div className="bg-white dark:bg-[#0B1120]">
      {/* Hero */}
      <section className="gradient-navy py-20">
        <div className="content-width">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{t('title')}</h1>
          <p className="text-white/70 text-lg max-w-2xl leading-relaxed">{t('subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="content-width">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#1E2A3B] rounded-3xl border border-[#E5E7EB] dark:border-white/10 p-8">
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">Send a Message</h2>
                <ContactForm />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10">
                <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">Direct Contact</h3>
                <div className="space-y-4">
                  <a
                    href="mailto:contact@hdhmarketfrontier.com"
                    className="flex items-center gap-3 text-sm text-[#4B5563] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center flex-shrink-0">
                      <Mail size={16} className="text-[#38BDF8]" />
                    </div>
                    contact@hdhmarketfrontier.com
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-[#4B5563] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#38BDF8] text-xs font-bold">in</span>
                    </div>
                    LinkedIn Profile
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-[#38BDF8]" />
                  <h3 className="font-semibold text-[#0F172A] dark:text-white">Response Time</h3>
                </div>
                <p className="text-sm text-[#4B5563] dark:text-slate-300 leading-relaxed">
                  I typically respond within 2-3 business days. For urgent matters, please indicate that in your subject line.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E2A3B]">
                <h3 className="font-semibold text-[#0F172A] dark:text-white mb-3">Topics Welcome</h3>
                <ul className="space-y-2 text-sm text-[#4B5563] dark:text-slate-300">
                  {['Research & industry exchange', 'Speaking engagements', 'Strategic collaboration', 'Media & press inquiries', 'Career opportunities'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#38BDF8] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
