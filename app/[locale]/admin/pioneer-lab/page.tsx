import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { FlaskConical, Briefcase, Building2, LineChart, Compass, BrainCircuit, ChevronRight } from 'lucide-react'

interface Props {
  params: Promise<{ locale: string }>
}

const MODULES = [
  {
    id: 'job-market-today',
    icon: Briefcase,
    title: 'Job Market Today',
    description: 'Track and curate relevant opportunities across financial data, market infrastructure, fintech, AI, and digital assets.',
    status: 'active' as const,
    href: '/admin/pioneer-lab/job-market-today',
  },
  {
    id: 'industry-watchlist',
    icon: LineChart,
    title: 'Industry Watchlist',
    description: 'Monitor key players, trends, and strategic developments across financial data and market infrastructure.',
    status: 'coming' as const,
    href: '#',
  },
  {
    id: 'company-intelligence',
    icon: Building2,
    title: 'Company Intelligence',
    description: 'Deep profiles on target organizations — structure, strategy, key people, and recent moves.',
    status: 'coming' as const,
    href: '#',
  },
  {
    id: 'opportunity-tracker',
    icon: Compass,
    title: 'Opportunity Tracker',
    description: 'Curate and track specific career opportunities through your personal pipeline.',
    status: 'coming' as const,
    href: '#',
  },
  {
    id: 'ai-research-desk',
    icon: BrainCircuit,
    title: 'AI Research Desk',
    description: 'AI-assisted research on companies, people, market trends, and career positioning.',
    status: 'coming' as const,
    href: '#',
  },
]

export default async function PioneerLabPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${locale}`)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] flex items-center justify-center flex-shrink-0 shadow-lg">
          <FlaskConical size={22} className="text-[#38BDF8]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">Pioneer Lab</h1>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1 max-w-lg">
            Private experimental workspace for career intelligence, market monitoring, and AI-assisted professional research.
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10">
        <p className="text-xs text-[#6B7280] dark:text-slate-400">
          Pioneer Lab is a private admin-only workspace. Data collected here is not visible to public visitors
          or regular users. Use only permitted data sources and follow the compliance guidelines in each module.
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULES.map(mod => {
          const Icon = mod.icon
          const isActive = mod.status === 'active'

          const card = (
            <div className={`group relative bg-white dark:bg-[#0F172A] rounded-2xl border p-5 transition-all ${
              isActive
                ? 'border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/40 hover:shadow-md dark:hover:shadow-[#38BDF8]/5 cursor-pointer'
                : 'border-[#E5E7EB] dark:border-white/5 opacity-60 cursor-not-allowed'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-[#F0F9FF] dark:bg-[#38BDF8]/10' : 'bg-[#F8FAFC] dark:bg-white/5'
                }`}>
                  <Icon size={17} className={isActive ? 'text-[#38BDF8]' : 'text-[#9CA3AF]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-[#0F172A] dark:text-white">{mod.title}</h3>
                    {!isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[#F1F5F9] dark:bg-white/5 text-[#9CA3AF] dark:text-slate-500">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
                </div>
                {isActive && (
                  <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#38BDF8] transition-colors flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          )

          return isActive ? (
            <Link key={mod.id} href={mod.href as '/'}>
              {card}
            </Link>
          ) : (
            <div key={mod.id}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
