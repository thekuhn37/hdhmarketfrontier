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
    <div className="bg-white dark:bg-[#0B1120]">
      {/* Hero */}
      <section className="gradient-navy py-24">
        <div className="content-width text-center">
          <div className="w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full overflow-hidden border-4 border-white/20 mx-auto mb-6 shadow-2xl flex-shrink-0">
            <img
              src="/images/headshot2.JPEG"
              alt="Harry D. Hwang"
              className="w-full h-full object-cover object-top"
              style={{ imageRendering: 'auto' }}
              loading="eager"
              decoding="sync"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{t('title')}</h1>
          <p className="text-white/60 text-xl">{t('subtitle')}</p>
        </div>
      </section>

      {/* About Me */}
      <section className="py-20">
        <div className="content-width">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-8 tracking-tight">About Me</h2>
            <p className="text-xl font-semibold text-[#0F172A] dark:text-slate-100 mb-6">Hello, I&apos;m Deoghoon Hwang.</p>
            <div className="space-y-5 text-[#4B5563] dark:text-slate-300 text-lg leading-relaxed">
              <p>
                I currently work in the market data and business strategy field at <strong className="font-semibold text-[#0F172A] dark:text-slate-100">Korea Exchange (KRX)</strong>, where I focus on data commercialization, market infrastructure, strategic partnerships, and the evolving role of technology in financial markets.
              </p>
              <p>
                My professional interests sit at the intersection of <strong className="font-semibold text-[#0F172A] dark:text-slate-100">markets, data, infrastructure, and technology</strong>. I am particularly interested in how emerging technologies such as artificial intelligence, cloud computing, digital assets, and blockchain are transforming the way financial information is created, distributed, and consumed.
              </p>
              <p>
                To deepen my understanding of the industry, I have pursued professional and academic development through my roles at KRX and certifications and specialized programs, including <strong className="font-semibold text-[#0F172A] dark:text-slate-100">FINRA&apos;s Securities Industry Essentials (SIE)</strong>, <strong className="font-semibold text-[#0F172A] dark:text-slate-100">FISD&apos;s Financial Information Associate (FIA)</strong>, and <strong className="font-semibold text-[#0F172A] dark:text-slate-100">KAIST&apos;s Blockchain &amp; Digital Assets program</strong>. I continue to explore new developments in AI and financial technology through ongoing study and hands-on projects.
              </p>
              <p>
                <strong className="font-semibold text-[#0F172A] dark:text-slate-100">HDH Market Frontier</strong> was created as a platform to document my learning journey, share industry insights, and explore the future of financial markets and data services. The views shared here are intended to encourage discussion, exchange ideas, and contribute to a better understanding of the rapidly evolving financial information ecosystem.
              </p>
              <p>
                My long-term goal is to become a global industry leader and entrepreneur with a deep understanding of markets, data, infrastructure, and technology. Until then, this website serves as a place to learn publicly, connect with professionals across the industry, and share perspectives on the trends shaping the future of finance.
              </p>
              <p>
                Discussions, ideas, and collaboration opportunities related to financial markets, market data, infrastructure, technology, and other topics covered on this website are always welcome. Please feel free to connect with me through the <Link href="/contact" className="text-[#0EA5E9] dark:text-[#38BDF8] font-medium hover:underline">contact information provided</Link> or via LinkedIn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer & Copyright Notice */}
      <section className="py-16 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="content-width">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-6 tracking-tight">Disclaimer &amp; Copyright Notice</h2>
            <div className="space-y-4 text-sm text-[#6B7280] dark:text-slate-400 leading-relaxed">
              <p>
                The content published on this website reflects my personal views and opinions only and does not represent the views, positions, or policies of my employer or any affiliated organization.
              </p>
              <p>
                This website is intended for educational, informational, and professional discussion purposes. It is not intended to defame any individual or organization, nor should its content be used for unlawful purposes.
              </p>
              <p>
                Unless otherwise stated, all original content on this website is protected by copyright. Sharing with proper attribution and a link to the original source is welcome; however, unauthorized modification, misrepresentation, reproduction, or commercial use of the content is prohibited without prior permission.
              </p>
              <p>
                Some content may be translated, summarized, or enhanced with the assistance of AI tools. While reasonable efforts are made to ensure accuracy, readers should independently verify information before making important professional, financial, legal, or business decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="py-20 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="content-width">
          <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-12 text-center tracking-tight">{t('expertise')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {EXPERTISE.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-white dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/40 dark:hover:border-[#38BDF8]/50 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center mb-4">
                  <Icon size={18} className="text-[#38BDF8]" />
                </div>
                <h3 className="font-semibold text-[#0F172A] dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-[#4B5563] dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What This Site Covers */}
      <section className="py-20 bg-white dark:bg-[#0B1120]">
        <div className="content-width max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-12 text-center tracking-tight">{t('whatThisSiteCover')}</h2>
          <div className="space-y-4">
            {WHAT_THIS_COVERS.map(({ cat, desc }) => (
              <div key={cat} className="flex gap-6 p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/40 dark:hover:border-[#38BDF8]/50 transition-colors">
                <div className="flex-shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-xs font-bold">{cat}</span>
                </div>
                <p className="text-[#4B5563] dark:text-slate-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="content-width text-center">
          <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-4">Let's Connect</h2>
          <p className="text-[#4B5563] dark:text-slate-400 mb-8 max-w-xl mx-auto">
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
