import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { BarChart2, Globe, Network, BrainCircuit, Coins, Database, ArrowRight, Shield } from 'lucide-react'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return { title: t('title'), description: t('summary') }
}

const EXPERTISE = [
  { icon: BarChart2, title: 'Financial Markets', desc: 'Deep knowledge of equity, derivatives, and fixed income market dynamics across global and Korean markets.' },
  { icon: Database, title: 'Market Data', desc: 'Strategic expertise in market data distribution, licensing, governance, and the evolving data ecosystem.' },
  { icon: Network, title: 'Market Infrastructure', desc: 'Understanding of exchange technology, trading systems, connectivity, and financial market infrastructure.' },
  { icon: BrainCircuit, title: 'AI in Finance', desc: 'Applied understanding of AI and machine learning use cases in financial data, operations, and market analysis.' },
  { icon: Coins, title: 'Digital Assets', desc: 'Informed perspective on tokenization, digital securities, stablecoins, and the intersection with traditional finance.' },
  { icon: Globe, title: 'Data Strategy', desc: 'Frameworks for building and executing data strategy in financial services organizations.' },
  { icon: Shield, title: 'Market Structure', desc: 'Analysis of regulatory changes, market microstructure, and the impact on trading and data ecosystems.' },
]

const WHAT_THIS_COVERS = [
  { cat: 'Markets', desc: 'Market structure, trading dynamics, liquidity, exchange competition, and global market trends.' },
  { cat: 'Data', desc: 'Market data strategy, data governance, distribution models, and data-driven approaches in finance.' },
  { cat: 'Infrastructure', desc: 'Financial market infrastructure, exchange technology, connectivity, and operational frameworks.' },
  { cat: 'AI', desc: 'Artificial intelligence applications in financial data, operations, risk management, and market analysis.' },
  { cat: 'Digital Assets', desc: 'Tokenization, digital securities, stablecoins, DeFi, and the convergence with traditional market infrastructure.' },
]

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="gradient-navy py-24">
        <div className="content-width text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">H</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{t('title')}</h1>
          <p className="text-white/60 text-xl">{t('subtitle')}</p>
        </div>
      </section>

      {/* Summary */}
      <section className="py-20">
        <div className="content-width">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#4B5563] text-lg leading-relaxed mb-8">{t('summary')}</p>
            <blockquote className="border-l-4 border-[#38BDF8] pl-6 py-2">
              <p className="text-xl font-medium text-[#0F172A] italic leading-relaxed">{t('missionText')}</p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="content-width">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-12 text-center tracking-tight">{t('expertise')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {EXPERTISE.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#38BDF8]/40 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center mb-4">
                  <Icon size={18} className="text-[#38BDF8]" />
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What This Site Covers */}
      <section className="py-20 bg-white">
        <div className="content-width max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-12 text-center tracking-tight">{t('whatThisSiteCover')}</h2>
          <div className="space-y-4">
            {WHAT_THIS_COVERS.map(({ cat, desc }) => (
              <div key={cat} className="flex gap-6 p-6 rounded-2xl border border-[#E5E7EB] hover:border-[#38BDF8]/40 transition-colors">
                <div className="flex-shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#0F172A] text-white text-xs font-bold">{cat}</span>
                </div>
                <p className="text-[#4B5563] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="content-width text-center">
          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Let's Connect</h2>
          <p className="text-[#4B5563] mb-8 max-w-xl mx-auto">
            For research collaborations, speaking opportunities, or strategic discussions, I welcome professional conversations.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-navy text-white font-semibold hover:opacity-90 transition-all"
          >
            {t('contactCta')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
