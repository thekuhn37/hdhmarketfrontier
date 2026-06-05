'use client'

import { useState, useEffect, useMemo } from 'react'
import { LayoutGrid, Table2, Download, RefreshCw, Clock, Trash2 } from 'lucide-react'
import type { PioneerJobPost } from '@/lib/supabase/types'
import ComplianceNotice from './ComplianceNotice'
import JobInputPanel from './JobInputPanel'
import JobFilters, { type FilterState } from './JobFilters'
import JobResultCard from './JobResultCard'
import JobResultTable from './JobResultTable'

const DEFAULT_FILTERS: FilterState = {
  keyword: '',
  status: '',
  companyCategory: '',
  functionType: '',
  sourcePlatform: '',
  location: '',
  sortBy: 'newest',
  showArchived: false,
}

export default function JobMarketToday() {
  const [jobs, setJobs] = useState<PioneerJobPost[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  async function loadJobs() {
    setFetching(true)
    try {
      const res = await fetch('/api/pioneer-lab/jobs')
      if (res.ok) {
        const data = await res.json() as PioneerJobPost[]
        setJobs(data)
        setLastFetched(new Date())
      }
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  function handleJobsExtracted(newJobs: Partial<PioneerJobPost>[]) {
    const valid = newJobs.filter((j): j is PioneerJobPost => Boolean(j?.id))
    setJobs(prev => {
      const ids = new Set(prev.map(j => j.id))
      const merged = prev.map(p => {
        const updated = valid.find(v => v.id === p.id)
        return updated ?? p
      })
      const brand_new = valid.filter(v => !ids.has(v.id))
      return [...brand_new, ...merged]
    })
  }

  function handleUpdate(id: string, updates: Partial<PioneerJobPost>) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j))
  }

  function handleDelete(id: string) {
    setJobs(prev => prev.filter(j => j.id !== id))
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function handleSelectAll() {
    const allDisplayedSelected = displayed.length > 0 && displayed.every(j => selectedIds.has(j.id))
    if (allDisplayedSelected) {
      setSelectedIds(prev => {
        const s = new Set(prev)
        displayed.forEach(j => s.delete(j.id))
        return s
      })
    } else {
      setSelectedIds(prev => {
        const s = new Set(prev)
        displayed.forEach(j => s.add(j.id))
        return s
      })
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    const ids = Array.from(selectedIds)
    await fetch('/api/pioneer-lab/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setJobs(prev => prev.filter(j => !selectedIds.has(j.id)))
    setSelectedIds(new Set())
    setBulkDeleting(false)
  }

  const displayed = useMemo(() => {
    let result = jobs.filter(j => !j.soft_deleted)

    if (!filters.showArchived) {
      result = result.filter(j => j.status !== 'archived')
    }
    if (filters.status) result = result.filter(j => j.status === filters.status)
    if (filters.companyCategory) result = result.filter(j => j.company_category === filters.companyCategory)
    if (filters.functionType) result = result.filter(j => j.function_type === filters.functionType)
    if (filters.sourcePlatform) result = result.filter(j => j.source_platform === filters.sourcePlatform)
    if (filters.location) result = result.filter(j => j.location?.toLowerCase().includes(filters.location.toLowerCase()))
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(j =>
        j.company_name?.toLowerCase().includes(kw) ||
        j.position_title?.toLowerCase().includes(kw) ||
        j.job_description?.toLowerCase().includes(kw) ||
        j.location?.toLowerCase().includes(kw)
      )
    }

    result = [...result].sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'relevance': return (b.ai_relevance_score ?? 0) - (a.ai_relevance_score ?? 0)
        case 'company': return a.company_name.localeCompare(b.company_name)
        case 'active_first': {
          const order = ['active', 'interesting', 'new', 'reviewing', 'applied', 'closed', 'hiring_completed', 'archived']
          return order.indexOf(a.status) - order.indexOf(b.status)
        }
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return result
  }, [jobs, filters])

  async function exportExcel() {
    const res = await fetch('/api/pioneer-lab/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job_market_today_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">Job Market Today</h1>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1 max-w-xl">
            Track and curate relevant opportunities across financial data, market infrastructure,
            fintech, AI, and digital assets. For personal research only.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lastFetched && (
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF] dark:text-slate-500">
              <Clock size={11} /> {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadJobs}
            disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-xs text-[#4B5563] dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-xs font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-all"
          >
            <Download size={12} /> Export Excel
          </button>
        </div>
      </div>

      <ComplianceNotice />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Saved', value: jobs.filter(j => !j.soft_deleted).length },
          { label: 'Active / Interesting', value: jobs.filter(j => !j.soft_deleted && ['active', 'interesting'].includes(j.status)).length },
          { label: 'Applied', value: jobs.filter(j => !j.soft_deleted && j.status === 'applied').length },
          { label: 'Showing', value: displayed.length },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0F172A] rounded-xl border border-[#E5E7EB] dark:border-white/10 px-4 py-3">
            <p className="text-lg font-bold text-[#0F172A] dark:text-white">{s.value}</p>
            <p className="text-[10px] text-[#6B7280] dark:text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Input panel */}
      <JobInputPanel onJobsExtracted={handleJobsExtracted} loading={loading} />

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {displayed.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={displayed.every(j => selectedIds.has(j.id))}
                ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !displayed.every(j => selectedIds.has(j.id)) }}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded cursor-pointer accent-[#38BDF8]"
              />
              <span className="text-xs text-[#6B7280] dark:text-slate-400">Select all</span>
            </label>
          )}
          <JobFilters filters={filters} onChange={setFilters} />
        </div>
        <div className="flex items-center gap-1 border border-[#E5E7EB] dark:border-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('card')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120]' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120]' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'}`}
          >
            <Table2 size={14} />
          </button>
        </div>
      </div>

      {/* Bulk selection action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <span className="text-xs font-medium text-red-700 dark:text-red-400">
            {selectedIds.size} job{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all disabled:opacity-50"
            >
              <Trash2 size={12} />
              {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size} selected`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {fetching ? (
        <div className="flex items-center justify-center py-16 text-[#6B7280] dark:text-slate-400">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading opportunities...
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#6B7280] dark:text-slate-400">
            {jobs.length === 0
              ? 'No job opportunities collected yet. Add URLs, paste job text, or upload a file to start building your private opportunity tracker.'
              : 'No results match the current filters.'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-3">
          {displayed.map(j => (
            <JobResultCard
              key={j.id}
              job={j}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              selected={selectedIds.has(j.id)}
              onToggleSelect={() => handleToggleSelect(j.id)}
            />
          ))}
        </div>
      ) : (
        <JobResultTable jobs={displayed} onUpdate={handleUpdate} onDelete={handleDelete} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />
      )}
    </div>
  )
}
