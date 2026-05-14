'use client'

import { COMPANY_CATEGORIES, FUNCTION_TYPES, SOURCE_PLATFORMS, JOB_STATUSES } from '@/lib/pioneer-lab/job-extraction'

export interface FilterState {
  keyword: string
  status: string
  companyCategory: string
  functionType: string
  sourcePlatform: string
  location: string
  sortBy: string
  showArchived: boolean
}

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
}

const LOCATIONS = ['', 'Korea', 'Singapore', 'Hong Kong', 'UK', 'Switzerland', 'US', 'Remote', 'Other']

const selectCls = 'px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0F172A] text-xs text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40'

export default function JobFilters({ filters, onChange }: Props) {
  const set = (key: keyof FilterState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })
  const setCheck = (key: keyof FilterState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...filters, [key]: e.target.checked })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Keyword search..."
        value={filters.keyword}
        onChange={set('keyword')}
        className={`${selectCls} min-w-[160px]`}
      />

      <select value={filters.status} onChange={set('status')} className={selectCls}>
        <option value="">All Statuses</option>
        {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <select value={filters.companyCategory} onChange={set('companyCategory')} className={selectCls}>
        <option value="">All Categories</option>
        {COMPANY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={filters.functionType} onChange={set('functionType')} className={selectCls}>
        <option value="">All Functions</option>
        {FUNCTION_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      <select value={filters.location} onChange={set('location')} className={selectCls}>
        {LOCATIONS.map(l => <option key={l} value={l}>{l || 'All Locations'}</option>)}
      </select>

      <select value={filters.sourcePlatform} onChange={set('sourcePlatform')} className={selectCls}>
        <option value="">All Sources</option>
        {SOURCE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={filters.sortBy} onChange={set('sortBy')} className={selectCls}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="relevance">Highest Relevance</option>
        <option value="company">Company A–Z</option>
        <option value="active_first">Active First</option>
      </select>

      <label className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showArchived}
          onChange={setCheck('showArchived')}
          className="rounded"
        />
        Show archived
      </label>
    </div>
  )
}
