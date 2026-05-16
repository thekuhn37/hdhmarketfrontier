import { CalendarRange } from 'lucide-react'

interface Props {
  start: string // ISO date string e.g. "2026-05-11"
  end: string   // ISO date string e.g. "2026-05-16"
}

function fmt(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export default function ResearchCoveragePeriod({ start, end }: Props) {
  return (
    <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/[0.03]">
      <CalendarRange size={11} className="text-[#38BDF8] flex-shrink-0" />
      <span className="text-[10px] font-semibold text-[#94A3B8] dark:text-slate-500 uppercase tracking-widest">
        Research Coverage
      </span>
      <span className="text-[10px] text-[#64748B] dark:text-slate-400 tabular-nums">
        {fmt(start)} — {fmt(end)}
      </span>
    </div>
  )
}
