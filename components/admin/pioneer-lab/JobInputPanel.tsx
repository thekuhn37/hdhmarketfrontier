'use client'

import { useState, useRef, useEffect } from 'react'
import { Link2, FileText, Upload, PenLine, Search, Loader2, KeyRound, Eye, EyeOff, Zap } from 'lucide-react'
import type { PioneerJobPost } from '@/lib/supabase/types'

type Tab = 'paste' | 'urls' | 'upload' | 'manual'

interface Props {
  onJobsExtracted: (jobs: Partial<PioneerJobPost>[]) => void
  loading: boolean
}

const MANUAL_DEFAULTS: Partial<PioneerJobPost> = {
  company_name: '', position_title: '', company_category: 'Other',
  function_type: 'Other', location: '', source_platform: 'Other',
  source_link: '', expected_salary: 'Not disclosed', job_description: '',
  status: 'new',
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0B1120] text-sm text-[#0F172A] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40'
const btnCls = 'flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-sm font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-all disabled:opacity-50 disabled:cursor-not-allowed'

const PLATFORMS = ['LinkedIn', 'FISD', 'Company Website', 'Greenhouse', 'Lever', 'Ashby', 'Workday', 'Indeed', 'Other']

function detectPlatform(url: string): string {
  if (url.includes('linkedin.com')) return 'LinkedIn'
  if (url.includes('greenhouse.io')) return 'Greenhouse'
  if (url.includes('lever.co')) return 'Lever'
  if (url.includes('ashbyhq.com')) return 'Ashby'
  if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) return 'Workday'
  if (url.includes('fisd.net')) return 'FISD'
  return 'Company Website'
}

export default function JobInputPanel({ onJobsExtracted, loading }: Props) {
  const [tab, setTab] = useState<Tab>('paste')
  const [pasteText, setPasteText] = useState('')
  const [urlsText, setUrlsText] = useState('')
  const [keywords, setKeywords] = useState('')
  const [sourcePlatform, setSourcePlatform] = useState('Other')
  const [liAt, setLiAt] = useState('')
  const [showLiAt, setShowLiAt] = useState(false)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [manualForm, setManualForm] = useState<Partial<PioneerJobPost>>(MANUAL_DEFAULTS)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('pioneer_li_at')
    if (saved) setLiAt(saved)
  }, [])

  function saveLiAt(val: string) {
    setLiAt(val)
    if (val) localStorage.setItem('pioneer_li_at', val)
    else localStorage.removeItem('pioneer_li_at')
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'paste', label: 'Paste Text', icon: <FileText size={14} /> },
    { id: 'urls', label: 'Manual URLs', icon: <Link2 size={14} /> },
    { id: 'upload', label: 'Upload File', icon: <Upload size={14} /> },
    { id: 'manual', label: 'Manual Add', icon: <PenLine size={14} /> },
  ]

  async function extractOne(
    rawText: string,
    sourceUrl?: string,
    platform?: string,
    preMappedFields?: Record<string, unknown> | null,
  ): Promise<Partial<PioneerJobPost>> {
    const res = await fetch('/api/pioneer-lab/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        sourceUrl,
        sourcePlatform: platform ?? sourcePlatform,
        keywords,
        preMappedFields: preMappedFields ?? null,
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<Partial<PioneerJobPost>>
  }

  async function save(jobs: Partial<PioneerJobPost>[]) {
    const saved = await Promise.all(
      jobs.map(j =>
        fetch('/api/pioneer-lab/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(j),
        }).then(r => r.json()).then(d => (d as { job: PioneerJobPost }).job)
      )
    )
    onJobsExtracted(saved.filter(Boolean))
  }

  // Core URL processor — used by both auto-search and manual URL tab
  async function processUrlList(urls: string[]): Promise<number> {
    const results: Partial<PioneerJobPost>[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      setStatus(`Scraping ${i + 1}/${urls.length}: ${new URL(url).hostname}...`)

      try {
        // Small delay to avoid rate-limiting
        if (i > 0) await new Promise(r => setTimeout(r, 600))

        const fetchRes = await fetch('/api/pioneer-lab/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, liAt: liAt || undefined }),
        })
        const fetchData = await fetchRes.json() as {
          blocked?: boolean
          message?: string
          content?: string
          preMappedFields?: Record<string, unknown> | null
        }

        if (fetchData.blocked) {
          setStatus(`⚠ ${i + 1}/${urls.length}: ${fetchData.message}`)
          continue
        }

        setStatus(`Extracting ${i + 1}/${urls.length}: AI analysis...`)
        const job = await extractOne(
          fetchData.content ?? '',
          url,
          detectPlatform(url),
          fetchData.preMappedFields,
        )
        results.push({ ...job, source_link: url })
      } catch (e) {
        setStatus(`✗ ${i + 1}/${urls.length}: ${e instanceof Error ? e.message : 'Error'}`)
      }
    }

    if (results.length) await save(results)
    return results.length
  }

  // ── Auto-search: keywords → LinkedIn search → scrape all results ──
  async function handleAutoSearch() {
    if (!keywords.trim()) { setStatus('Enter keywords above before searching.'); return }

    setIsLoading(true)
    setStatus(`Searching LinkedIn for "${keywords}"...`)

    try {
      const res = await fetch('/api/pioneer-lab/search-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, liAt: liAt || undefined, maxResults: 25 }),
      })
      const data = await res.json() as {
        blocked?: boolean
        needsLogin?: boolean
        message?: string
        urls?: string[]
        count?: number
      }

      if (data.blocked) {
        setStatus(`⚠ ${data.message}`)
        setIsLoading(false)
        return
      }

      if (!data.urls?.length) {
        setStatus(data.message ?? 'No jobs found. Try broader keywords.')
        setIsLoading(false)
        return
      }

      setStatus(`Found ${data.count} jobs — collecting all...`)
      const saved = await processUrlList(data.urls)
      setStatus(saved > 0 ? `✓ Saved ${saved} job(s) from LinkedIn.` : 'No jobs could be extracted. Check your li_at cookie.')
    } catch (e) {
      setStatus(`Search failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    setIsLoading(false)
  }

  // ── Manual tabs ──
  async function handlePaste() {
    if (!pasteText.trim()) return
    setIsLoading(true)
    setStatus('Extracting with AI...')
    try {
      const job = await extractOne(pasteText, undefined, sourcePlatform)
      await save([job])
      setPasteText('')
      setStatus('✓ Job saved.')
    } catch (e) {
      setStatus(`Extraction failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUrls() {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'))
    if (!urls.length) { setStatus('Enter at least one valid URL.'); return }
    setIsLoading(true)
    const saved = await processUrlList(urls)
    setUrlsText('')
    setStatus(saved > 0 ? `✓ Saved ${saved} job(s).` : 'No jobs could be extracted. Check URLs or set li_at cookie.')
    setIsLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setStatus('Reading file...')
    const text = await file.text()
    setStatus('Extracting with AI...')
    try {
      const job = await extractOne(text, undefined, sourcePlatform)
      await save([job])
      if (fileRef.current) fileRef.current.value = ''
      setStatus('✓ Job saved.')
    } catch {
      setStatus('File extraction failed. Try pasting the text instead.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManual() {
    if (!manualForm.company_name || !manualForm.position_title) {
      setStatus('Company Name and Position Title are required.')
      return
    }
    setIsLoading(true)
    await save([manualForm])
    setManualForm(MANUAL_DEFAULTS)
    setStatus('✓ Job saved.')
    setIsLoading(false)
  }

  const setManualField = (key: keyof PioneerJobPost) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setManualForm(f => ({ ...f, [key]: e.target.value }))

  const busy = loading || isLoading

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">

      {/* ── Top: keywords + cookie ── */}
      <div className="px-4 pt-4 pb-4 border-b border-[#F1F5F9] dark:border-white/5 space-y-2">
        <div className="flex gap-2 items-center">
          <Search size={14} className="text-[#6B7280] flex-shrink-0" />
          <input
            type="text"
            placeholder="Keywords — e.g. 'market data business development Singapore'..."
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !busy) handleAutoSearch() }}
            className={`${inputCls} text-xs`}
          />
        </div>

        <div className="flex gap-2 items-center">
          <KeyRound size={14} className="text-[#38BDF8] flex-shrink-0" />
          <div className="flex-1 relative">
            <input
              type={showLiAt ? 'text' : 'password'}
              placeholder="LinkedIn session cookie (li_at) — F12 → Application → Cookies → linkedin.com → li_at"
              value={liAt}
              onChange={e => saveLiAt(e.target.value)}
              className={`${inputCls} text-xs pr-8`}
            />
            <button
              type="button"
              onClick={() => setShowLiAt(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-slate-300"
            >
              {showLiAt ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {liAt && <span className="text-[10px] text-green-600 dark:text-green-400 whitespace-nowrap">cookie set</span>}
        </div>

        {/* ── Primary action ── */}
        <button
          onClick={handleAutoSearch}
          disabled={busy || !keywords.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 disabled:cursor-not-allowed text-[#0B1120] font-semibold text-sm transition-all"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
          {busy ? status || 'Working...' : 'Auto-Search LinkedIn'}
        </button>
        <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500 text-center">
          Searches LinkedIn with your keywords, scrapes up to 25 matching jobs, and extracts all with AI — automatically.
          {!liAt && <span className="text-amber-500 dark:text-amber-400"> Set li_at cookie above to access LinkedIn.</span>}
        </p>

        {/* Status line (outside button when not loading) */}
        {!busy && status && (
          <p className={`text-xs flex items-center gap-1.5 ${status.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-[#6B7280] dark:text-slate-400'}`}>
            {status}
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-white/10" />
        <span className="text-[10px] text-[#9CA3AF] dark:text-slate-500 uppercase tracking-wider">or add manually</span>
        <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-white/10" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#E5E7EB] dark:border-white/10">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setStatus('') }}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
              tab === t.id
                ? 'border-[#38BDF8] text-[#0F172A] dark:text-white'
                : 'border-transparent text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="p-4">
        {tab === 'paste' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select value={sourcePlatform} onChange={e => setSourcePlatform(e.target.value)} className={`${inputCls} max-w-[160px]`}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 self-center">Source platform</p>
            </div>
            <textarea
              rows={8}
              placeholder="Paste the full job description text here — from LinkedIn, FISD, company website, or any source..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className={inputCls}
            />
            <button onClick={handlePaste} disabled={busy || !pasteText.trim()} className={btnCls}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Extract Job Data
            </button>
          </div>
        )}

        {tab === 'urls' && (
          <div className="space-y-3">
            <p className="text-xs text-[#6B7280] dark:text-slate-400">
              Paste specific job URLs to scrape — one per line. LinkedIn URLs need the <code className="bg-[#F1F5F9] dark:bg-white/5 px-0.5 rounded">li_at</code> cookie set above.
            </p>
            <textarea
              rows={6}
              placeholder="One URL per line:&#10;https://www.linkedin.com/jobs/view/1234567890/&#10;https://boards.greenhouse.io/company/jobs/456&#10;https://careers.bloomberg.com/job/789"
              value={urlsText}
              onChange={e => setUrlsText(e.target.value)}
              className={inputCls}
            />
            <button onClick={handleUrls} disabled={busy || !urlsText.trim()} className={btnCls}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Scrape & Extract
            </button>
          </div>
        )}

        {tab === 'upload' && (
          <div className="space-y-3">
            <p className="text-xs text-[#6B7280] dark:text-slate-400">Upload a saved .txt, .html, or .csv file containing job posting content.</p>
            <div className="flex gap-2">
              <select value={sourcePlatform} onChange={e => setSourcePlatform(e.target.value)} className={`${inputCls} max-w-[160px]`}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <label className="flex flex-col items-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed border-[#E5E7EB] dark:border-white/10 cursor-pointer hover:border-[#38BDF8] transition-colors">
              <Upload size={24} className="text-[#6B7280] dark:text-slate-400" />
              <span className="text-sm text-[#4B5563] dark:text-slate-300">Click to upload (.txt, .html, .csv)</span>
              <input ref={fileRef} type="file" accept=".txt,.html,.csv" className="hidden" onChange={handleUpload} disabled={busy} />
            </label>
          </div>
        )}

        {tab === 'manual' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Company Name *</label>
              <input value={manualForm.company_name ?? ''} onChange={setManualField('company_name')} className={inputCls} placeholder="e.g. Bloomberg L.P." />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Position Title *</label>
              <input value={manualForm.position_title ?? ''} onChange={setManualField('position_title')} className={inputCls} placeholder="e.g. Senior Market Data Analyst" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Company Category</label>
              <select value={manualForm.company_category ?? 'Other'} onChange={setManualField('company_category')} className={inputCls}>
                {['Exchange', 'Market Data Vendor', 'Index Provider', 'Financial Information Provider', 'Trading Technology', 'Market Infrastructure', 'Fintech', 'Data Infrastructure', 'AI / Analytics', 'Digital Assets', 'RegTech / SupTech', 'Asset Management', 'Broker / Dealer', 'Bank', 'Consulting', 'Government / Regulator', 'Academic / Research', 'Other'].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Function / Role Type</label>
              <select value={manualForm.function_type ?? 'Other'} onChange={setManualField('function_type')} className={inputCls}>
                {['Market Data', 'Data Strategy', 'Business Development', 'Product Management', 'Sales / Account Management', 'Exchange Strategy', 'Market Structure', 'Data Licensing', 'Data Governance', 'AI / Data Science', 'Engineering', 'Cloud / Infrastructure', 'Digital Assets', 'Research', 'Regulation / Policy', 'Operations', 'Other'].map(f =>
                  <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Location</label>
              <input value={manualForm.location ?? ''} onChange={setManualField('location')} className={inputCls} placeholder="e.g. Singapore" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Source Platform</label>
              <select value={manualForm.source_platform ?? 'Other'} onChange={setManualField('source_platform')} className={inputCls}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Source Link</label>
              <input value={manualForm.source_link ?? ''} onChange={setManualField('source_link')} className={inputCls} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1">Job Description</label>
              <textarea rows={4} value={manualForm.job_description ?? ''} onChange={setManualField('job_description')} className={inputCls} placeholder="Brief description of the role..." />
            </div>
            <div className="sm:col-span-2">
              <button onClick={handleManual} disabled={busy} className={btnCls}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
                Save Job
              </button>
            </div>
          </div>
        )}

        {/* Status for manual tabs */}
        {!busy && status && tab !== 'paste' && (
          <p className={`mt-3 text-xs flex items-center gap-1.5 ${status.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-[#6B7280] dark:text-slate-400'}`}>
            {status}
          </p>
        )}
        {busy && tab !== 'paste' && (
          <p className="mt-3 text-xs flex items-center gap-1.5 text-[#6B7280] dark:text-slate-400">
            <Loader2 size={12} className="animate-spin flex-shrink-0" /> {status}
          </p>
        )}
      </div>
    </div>
  )
}
