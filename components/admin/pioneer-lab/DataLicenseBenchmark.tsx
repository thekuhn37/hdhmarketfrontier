'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Scale, Building2, FileText, Send, Download, Trash2,
  MessageSquare, AlertTriangle, Loader2, RefreshCw,
  ChevronDown, ChevronRight, X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type {
  ExchangeItem, DocumentItem, ChatMessage, Citation, ConfidenceLevel,
} from '@/lib/data-license-benchmark/types'
import {
  getExchanges, getDocuments, sendLicenseQuestion,
  exportChatHistory, exportChatHistoryPdf,
  translateToEnglish, translateToLanguage,
} from '@/lib/data-license-benchmark/api'
import DocManagementModal from './DocManagementModal'

// ─── Exchange Detection ───────────────────────────────────────────────────────

const EXCHANGE_KEYWORDS: Record<string, string[]> = {
  CME:    ['cme group', 'chicago mercantile exchange', 'chicago mercantile'],
  ASX:    ['australian securities exchange', 'australian stock exchange'],
  LSE:    ['london stock exchange', 'london stock'],
  NASDAQ: ['nasdaq'],
  HKEX:   ['hkex', 'hong kong exchange', 'hong kong stock exchange'],
  NYSE:   ['nyse', 'new york stock exchange'],
  ICE:    ['intercontinental exchange', 'ice data'],
  CBOE:   ['cboe', 'chicago board options'],
  SGX:    ['sgx', 'singapore exchange'],
  TMX:    ['tmx', 'toronto stock exchange'],
  EUREX:  ['eurex'],
}

const COMPARISON_SIGNALS = [
  'compare', 'versus', ' vs ', 'vs.', 'differ', 'difference between',
  'differences between', 'both exchanges', 'how does', 'contrasted',
]

type ScopeType = 'focused' | 'comparison' | null

function resolveQueryScope(
  question: string,
  enabledExchanges: string[],
): {
  queryExchanges: string[]
  scopeType: ScopeType
  scopeData: { exchange?: string; exchanges?: string }
  questionType: 'single' | 'comparison' | 'generic'
} {
  const lower = question.toLowerCase()
  const detected = enabledExchanges.filter(code => {
    const aliases = EXCHANGE_KEYWORDS[code] ?? []
    return lower.includes(code.toLowerCase()) || aliases.some(a => lower.includes(a))
  })
  const isComparison = COMPARISON_SIGNALS.some(s => lower.includes(s))

  if (detected.length === 0) {
    return { queryExchanges: enabledExchanges, scopeType: null, scopeData: {}, questionType: 'generic' }
  }
  if (isComparison || detected.length >= 2) {
    return {
      queryExchanges: detected,
      scopeType: 'comparison',
      scopeData: { exchanges: detected.join(' + ') },
      questionType: 'comparison',
    }
  }
  return {
    queryExchanges: [detected[0]],
    scopeType: 'focused',
    scopeData: { exchange: detected[0] },
    questionType: 'single',
  }
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

const INLINE_PATTERN = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|\[(?:PERMITTED|PROHIBITED|CONDITIONAL)\])/g

function InlineContent({ text }: { text: string }) {
  const parts = text.split(INLINE_PATTERN)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-[#0F172A] dark:text-white">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i} className="italic text-[#374151] dark:text-slate-300">{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-white/10 font-mono text-[11px] text-[#0F172A] dark:text-[#38BDF8]">{part.slice(1, -1)}</code>
        }
        if (part === '[PERMITTED]') {
          return <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">PERMITTED</span>
        }
        if (part === '[PROHIBITED]') {
          return <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">PROHIBITED</span>
        }
        if (part === '[CONDITIONAL]') {
          return <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">CONDITIONAL</span>
        }
        return part || null
      })}
    </>
  )
}

const SECTION_LABEL_RE = /^\[(Conclusion|Supporting Evidence|Conditions?|Exceptions?|Evidence|Note|Warning|Interpretation)\](.*)/

function MarkdownAnswer({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const nodes: React.ReactNode[] = []
  const listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = (flushKey: string) => {
    if (!listType || listItems.length === 0) return
    const Tag = listType
    const cls = 'space-y-1 my-2 pl-4 ' + (listType === 'ul' ? 'list-disc list-outside' : 'list-decimal list-outside')
    nodes.push(<Tag key={flushKey} className={cls}>{[...listItems]}</Tag>)
    listItems.length = 0
    listType = null
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const k = `l${idx}`
    if (!trimmed) { flushList(`f${idx}`); return }

    if (trimmed.startsWith('### ')) { flushList(`f${idx}`); nodes.push(<h4 key={k} className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-slate-400 mt-4 mb-1.5"><InlineContent text={trimmed.slice(4)} /></h4>); return }
    if (trimmed.startsWith('## '))  { flushList(`f${idx}`); nodes.push(<h3 key={k} className="text-sm font-semibold text-[#0F172A] dark:text-white mt-4 mb-1.5 pb-1.5 border-b border-[#F1F5F9] dark:border-white/10"><InlineContent text={trimmed.slice(3)} /></h3>); return }
    if (trimmed.startsWith('# '))   { flushList(`f${idx}`); nodes.push(<h2 key={k} className="text-base font-bold text-[#0F172A] dark:text-white mt-4 mb-2"><InlineContent text={trimmed.slice(2)} /></h2>); return }
    if (/^---+$/.test(trimmed))     { flushList(`f${idx}`); nodes.push(<hr key={k} className="border-[#E5E7EB] dark:border-white/10 my-3" />); return }
    if (trimmed.startsWith('> '))   { flushList(`f${idx}`); nodes.push(<blockquote key={k} className="border-l-2 border-[#38BDF8]/40 pl-3 my-1.5 text-sm text-[#6B7280] dark:text-slate-400 italic leading-relaxed"><InlineContent text={trimmed.slice(2)} /></blockquote>); return }

    const bulletM = trimmed.match(/^[-*+]\s+(.+)/)
    if (bulletM) {
      if (listType !== 'ul') { flushList(`f${idx}`); listType = 'ul' }
      listItems.push(<li key={k} className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed"><InlineContent text={bulletM[1]} /></li>)
      return
    }
    const numM = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (numM) {
      if (listType !== 'ol') { flushList(`f${idx}`); listType = 'ol' }
      listItems.push(<li key={k} className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed"><InlineContent text={numM[2]} /></li>)
      return
    }

    const secM = trimmed.match(SECTION_LABEL_RE)
    if (secM) {
      flushList(`f${idx}`)
      const label = secM[1]
      const rest  = secM[2].trim()
      const badgeCls = label === 'Conclusion' ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]'
        : (label.startsWith('Condition') || label.startsWith('Exception')) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
        : label === 'Warning' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        : 'bg-[#F1F5F9] text-[#4B5563] dark:bg-white/10 dark:text-slate-400'
      nodes.push(
        <div key={k} className="flex items-start gap-2 mt-3 mb-1">
          <span className={cn('flex-shrink-0 mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider', badgeCls)}>{label}</span>
          {rest && <span className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed"><InlineContent text={rest} /></span>}
        </div>,
      )
      return
    }

    if (trimmed.startsWith('Interpretation:')) {
      flushList(`f${idx}`)
      nodes.push(<p key={k} className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed italic border-l-2 border-[#38BDF8]/30 pl-3 my-1.5"><InlineContent text={trimmed} /></p>)
      return
    }

    flushList(`f${idx}`)
    nodes.push(<p key={k} className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed"><InlineContent text={trimmed} /></p>)
  })

  flushList('final')
  return <div className="space-y-1.5 py-0.5">{nodes}</div>
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-1',
        checked ? 'bg-[#38BDF8]' : 'bg-[#D1D5DB] dark:bg-white/20',
      )}
    >
      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  medium:  'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  low:     'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  unknown: 'bg-[#F1F5F9] text-[#6B7280] dark:bg-white/5 dark:text-slate-400',
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const t = useTranslations('dlb')
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', CONFIDENCE_STYLES[level])}>
      {t(`confidence.${level}`)}
    </span>
  )
}

// ─── Citation Card ────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_LICENSE_POLICY_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

const EXCHANGE_BADGE: Record<string, string> = {
  CME:    'bg-blue-700 text-white',
  ASX:    'bg-emerald-700 text-white',
  LSE:    'bg-violet-700 text-white',
  NASDAQ: 'bg-orange-600 text-white',
  HKEX:   'bg-red-700 text-white',
  NYSE:   'bg-indigo-700 text-white',
  ICE:    'bg-cyan-700 text-white',
  CBOE:   'bg-purple-700 text-white',
}

function CitationCard({ citation }: { citation: Citation }) {
  const pdfUrl = citation.documentId
    ? `${API_BASE}/api/documents/${citation.documentId}/pdf${citation.page ? `#page=${citation.page}` : ''}`
    : null
  const badgeCls = EXCHANGE_BADGE[citation.exchange] ?? 'bg-[#0F172A] text-white dark:bg-[#1E3A5F] dark:text-[#38BDF8]'
  const excerpt = citation.excerpt
    ? (citation.excerpt.length > 300 ? citation.excerpt.slice(0, 300) + '…' : citation.excerpt)
    : null

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0B1120] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] dark:bg-white/3 border-b border-[#E5E7EB] dark:border-white/5">
        <span className={cn('flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider', badgeCls)}>{citation.exchange}</span>
        <span className="flex-1 text-[11px] font-medium text-[#374151] dark:text-slate-300 truncate min-w-0">{citation.agreementTitle}</span>
        <span className="flex-shrink-0 text-[10px] font-mono text-[#9CA3AF] dark:text-slate-500 bg-[#F1F5F9] dark:bg-white/5 px-1.5 py-0.5 rounded">&sect;{citation.sectionNumber}</span>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-1 text-[10px] text-[#38BDF8] hover:text-[#0EA5E9] transition-colors font-medium ml-1" title={citation.page ? `Open PDF — page ${citation.page}` : 'Open PDF'}>
            <FileText size={11} />
            {citation.page ? `p.${citation.page}` : 'PDF'}
          </a>
        )}
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        {citation.sectionTitle && <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{citation.sectionTitle}</p>}
        {excerpt && <p className="text-[11px] text-[#6B7280] dark:text-slate-400 leading-relaxed border-l-2 border-[#38BDF8]/30 pl-2.5 italic">&ldquo;{excerpt}&rdquo;</p>}
      </div>
    </div>
  )
}

// ─── Chat Empty State ─────────────────────────────────────────────────────────

const SAMPLE_PROMPTS = [
  'Can CME data be used to create CFD products?',
  'Compare audit obligations between CME and ASX.',
  'What are ASX professional real-time data fees?',
  'Can I create an index using ASX data?',
]

function ChatEmptyState({ onSamplePrompt }: { onSamplePrompt: (q: string) => void }) {
  const t = useTranslations('dlb')
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] dark:bg-[#38BDF8]/10 flex items-center justify-center mb-4 shadow-sm">
        <MessageSquare size={24} className="text-[#38BDF8]" />
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] dark:text-white mb-2">{t('chat.emptyTitle')}</h3>
      <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-6 max-w-xs">{t('chat.emptyDesc')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {SAMPLE_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => onSamplePrompt(prompt)}
            className="px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-xs text-[#4B5563] dark:text-slate-300 hover:border-[#38BDF8]/40 hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/5 transition-all text-left leading-snug"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── User Message ─────────────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean', ja: 'Japanese', zh: 'Chinese', fr: 'French', de: 'German',
  es: 'Spanish', pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', it: 'Italian',
}

function UserMessage({ message }: { message: ChatMessage }) {
  const t = useTranslations('dlb')
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-[#0F172A] dark:bg-[#1E3A5F] text-white text-sm leading-relaxed">
          {message.content}
        </div>
        {message.translatedFrom && message.translatedText && (
          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#F0F9FF] dark:bg-[#38BDF8]/10 border border-[#BAE6FD] dark:border-[#38BDF8]/20 text-right">
            <p className="text-[10px] text-[#0EA5E9] dark:text-[#38BDF8]">
              {t('chat.translatedFrom', { lang: LANGUAGE_NAMES[message.translatedFrom] ?? message.translatedFrom.toUpperCase() })} &middot; &ldquo;{message.translatedText}&rdquo;
            </p>
          </div>
        )}
        <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500 mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ─── Assistant Message ────────────────────────────────────────────────────────

const AUTO_EXPAND_LIMIT = 3

function AssistantMessage({ message }: { message: ChatMessage }) {
  const t = useTranslations('dlb')
  const citationCount = message.citations?.length ?? 0
  const [citationsOpen, setCitationsOpen] = useState(citationCount > 0 && citationCount <= AUTO_EXPAND_LIMIT)

  const showKey = citationCount === 1 ? 'chat.showSource' : 'chat.showSources'
  const hideKey = citationCount === 1 ? 'chat.hideSource' : 'chat.hideSources'

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] space-y-2.5">
        <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E5E7EB] dark:border-white/10">
          <MarkdownAnswer content={message.content} />
        </div>

        <div className="flex items-center gap-2 flex-wrap px-1">
          {message.confidence && <ConfidenceBadge level={message.confidence} />}
          {message.scopeLabel && (
            <span className="text-[10px] text-[#6B7280] dark:text-slate-500 border border-[#E5E7EB] dark:border-white/10 px-2 py-0.5 rounded-full">
              {message.scopeLabel}
            </span>
          )}
          {citationCount > 0 && (
            <button onClick={() => setCitationsOpen(v => !v)} className="flex items-center gap-1 text-[10px] text-[#38BDF8] hover:text-[#0EA5E9] transition-colors font-medium">
              <FileText size={11} />
              {citationsOpen ? t(hideKey, { count: citationCount }) : t(showKey, { count: citationCount })}
              {citationsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
          )}
          <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500 ml-auto">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {citationsOpen && citationCount > 0 && (
          <div className="space-y-2 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500">{t('chat.sources')}</p>
            {message.citations!.map(c => <CitationCard key={c.citationId} citation={c} />)}
          </div>
        )}

        {message.warnings && message.warnings.length > 0 && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 mx-1 space-y-0.5">
            {message.warnings.map((w, i) => <p key={i} className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">{w}</p>)}
          </div>
        )}

        {message.disclaimer && (
          <div className="px-3 py-2 rounded-lg bg-[#F1F5F9] dark:bg-white/3 border border-[#E5E7EB] dark:border-white/5 mx-1">
            <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500 italic leading-relaxed">{message.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Loading Message ──────────────────────────────────────────────────────────

function LoadingMessage() {
  const t = useTranslations('dlb')
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E5E7EB] dark:border-white/10">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-[#38BDF8]" />
          <span className="text-xs text-[#6B7280] dark:text-slate-400">{t('chat.analyzing')}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataLicenseBenchmark() {
  const t = useTranslations('dlb')

  const [exchanges, setExchanges] = useState<ExchangeItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [initLoading, setInitLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [docManagementOpen, setDocManagementOpen] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const enabledExchanges = exchanges.filter(e => e.enabled).map(e => e.code)
  const noExchangeSelected = enabledExchanges.length === 0

  useEffect(() => {
    Promise.all([getExchanges(), getDocuments()])
      .then(([excRes, docRes]) => {
        setExchanges(excRes.exchanges)
        setDocuments(docRes.documents)
      })
      .catch(console.error)
      .finally(() => setInitLoading(false))
  }, [])

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chatMessages, loading])

  async function refreshExchanges() {
    try {
      const res = await getExchanges()
      setExchanges(prev =>
        res.exchanges.map(fetched => {
          const existing = prev.find(e => e.id === fetched.id)
          return existing ? { ...fetched, enabled: existing.enabled } : fetched
        }),
      )
    } catch (err) {
      console.error('Failed to refresh exchanges', err)
    }
  }

  function handleDocumentUpdate(doc: DocumentItem) {
    setDocuments(prev => prev.map(d => (d.id === doc.id ? doc : d)))
  }

  function handleToggleExchange(id: string) {
    setExchanges(prev => prev.map(e => (e.id === id ? { ...e, enabled: !e.enabled } : e)))
  }

  async function handleSendQuestion() {
    const question = input.trim()
    if (!question || loading || noExchangeSelected) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Step 1: Translate question to English if needed
      const { translatedText, wasTranslated, originalLanguage } = await translateToEnglish(question)
      const queryText = wasTranslated ? translatedText : question

      if (wasTranslated) {
        setChatMessages(prev => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], translatedFrom: originalLanguage, translatedText },
        ])
      }

      // Step 2: Resolve which exchanges to query
      const { queryExchanges, scopeType, scopeData, questionType } = resolveQueryScope(queryText, enabledExchanges)
      const scopeLabel = scopeType === 'focused' ? t('scope.focused', scopeData as { exchange: string })
        : scopeType === 'comparison' ? t('scope.comparison', scopeData as { exchanges: string })
        : undefined

      // Step 3: Query the backend
      const response = await sendLicenseQuestion({ question: queryText, enabledExchanges: queryExchanges })

      // Step 4: Translate the answer back to the user's language if needed
      const answerInUserLang = wasTranslated
        ? await translateToLanguage(response.answer, originalLanguage)
        : response.answer

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answerInUserLang,
        timestamp: new Date(),
        citations: response.citations,
        confidence: response.confidence,
        disclaimer: response.disclaimer,
        classification: response.classification,
        warnings: response.warnings,
        scopeLabel: questionType !== 'generic' ? scopeLabel : undefined,
      }
      setChatMessages(prev => [...prev, assistantMsg])
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('chat.errorMsg'),
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleExportMd() {
    if (chatMessages.length === 0) return
    await exportChatHistory(chatMessages, enabledExchanges, 'markdown')
  }

  function handleExportPdf() {
    if (chatMessages.length === 0) return
    exportChatHistoryPdf(chatMessages, enabledExchanges)
  }

  function handleClearChat() { setChatMessages([]) }
  function handleDocumentDelete(id: string) { setDocuments(prev => prev.filter(d => d.id !== id)) }
  function handleDocumentAdd(doc: DocumentItem) { setDocuments(prev => [doc, ...prev]) }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0B1120] text-sm text-[#0F172A] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40'

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] flex items-center justify-center flex-shrink-0 shadow-md">
            <Scale size={18} className="text-[#38BDF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">{t('title')}</h1>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-0.5 max-w-xl">{t('description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportPdf} disabled={chatMessages.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-xs text-[#4B5563] dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={12} /> {t('actions.exportPdfShort')}
          </button>
          <button onClick={handleExportMd} disabled={chatMessages.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-xs text-[#4B5563] dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={12} /> {t('actions.mdShort')}
          </button>
          <button onClick={handleClearChat} disabled={chatMessages.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-xs text-[#4B5563] dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <RefreshCw size={12} /> {t('actions.clearShort')}
          </button>
        </div>
      </div>

      {/* Compliance notice */}
      {showDisclaimer && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex-1">
              <span className="font-semibold">{t('researchLabel')}</span>{' '}{t('researchText')}
            </p>
            <button onClick={() => setShowDisclaimer(false)} className="p-0.5 rounded text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex-shrink-0" aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="flex gap-4 items-start">

        {/* ── Left sidebar ── */}
        <div className="w-72 flex-shrink-0 space-y-3">

          {/* Exchange panel */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F1F5F9] dark:border-white/5">
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-[#38BDF8]" />
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-slate-400">{t('exchanges.heading')}</h2>
              </div>
            </div>

            <div className="divide-y divide-[#F1F5F9] dark:divide-white/5">
              {initLoading ? (
                <div className="px-4 py-4 flex items-center gap-2 text-xs text-[#9CA3AF] dark:text-slate-500">
                  <Loader2 size={13} className="animate-spin" />
                  {t('chat.analyzing')}
                </div>
              ) : exchanges.map(exchange => (
                <div key={exchange.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-[#0F172A] dark:text-white">{exchange.code}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider', exchange.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-[#F1F5F9] text-[#9CA3AF] dark:bg-white/5 dark:text-slate-500')}>
                          {exchange.status === 'active' ? t('exchanges.statusActive') : t('exchanges.statusInactive')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-slate-400 leading-snug">{exchange.description}</p>
                    </div>
                    <ToggleSwitch checked={exchange.enabled} onChange={() => handleToggleExchange(exchange.id)} />
                  </div>
                </div>
              ))}
            </div>

            {noExchangeSelected && !initLoading && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20">
                <p className="text-[10px] text-amber-600 dark:text-amber-400">{t('exchanges.noSelected')}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button onClick={() => setDocManagementOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:border-[#38BDF8]/30 transition-all font-medium">
              <FileText size={14} className="text-[#38BDF8]" />
              {t('actions.docManagement')}
              <span className="ml-auto text-xs text-[#9CA3AF] dark:text-slate-500 font-normal">{documents.length}</span>
            </button>
            <button onClick={handleExportPdf} disabled={chatMessages.length === 0} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              <Download size={14} className="text-[#6B7280]" />
              {t('actions.exportPdf')}
            </button>
            <button onClick={handleExportMd} disabled={chatMessages.length === 0} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              <Download size={14} className="text-[#6B7280]" />
              {t('actions.exportMd')}
            </button>
            <button onClick={handleClearChat} disabled={chatMessages.length === 0} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-white/10 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 size={14} className="text-[#6B7280]" />
              {t('actions.clearChat')}
            </button>
          </div>

          {/* Active scope indicator */}
          <div className="px-3 py-3 rounded-xl bg-[#F8FAFC] dark:bg-white/3 border border-[#E5E7EB] dark:border-white/5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 mb-2">{t('exchanges.scopeHeading')}</p>
            {enabledExchanges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {enabledExchanges.map(code => (
                  <span key={code} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#38BDF8]/10 text-[#0EA5E9] dark:text-[#38BDF8]">{code}</span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF] dark:text-slate-500 italic">{t('exchanges.noEnabled')}</p>
            )}
          </div>
        </div>

        {/* ── Right chat panel ── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden" style={{ minHeight: 'calc(100vh - 17rem)' }}>
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.length === 0 && !loading ? (
              <ChatEmptyState onSamplePrompt={q => setInput(q)} />
            ) : (
              <>
                {chatMessages.map(msg =>
                  msg.role === 'user'
                    ? <UserMessage key={msg.id} message={msg} />
                    : <AssistantMessage key={msg.id} message={msg} />,
                )}
                {loading && <LoadingMessage />}
              </>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-[#E5E7EB] dark:border-white/10 p-4 flex-shrink-0">
            {noExchangeSelected && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                <p className="text-xs text-amber-700 dark:text-amber-400">{t('chat.noExchangeWarning')}</p>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !loading) { e.preventDefault(); handleSendQuestion() } }}
                placeholder={t('chat.placeholder')}
                disabled={loading || noExchangeSelected}
                className={cn(inputCls, 'resize-none', 'bg-[#F8FAFC] dark:bg-[#0B1120]', 'rounded-xl', 'disabled:opacity-50 disabled:cursor-not-allowed')}
              />
              <button
                onClick={handleSendQuestion}
                disabled={!input.trim() || loading || noExchangeSelected}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Submit"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-[#9CA3AF] dark:text-slate-500">
              Press{' '}<kbd className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-white/5 font-mono">Enter</kbd>{' '}
              to submit &middot;{' '}
              <kbd className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-white/5 font-mono">Shift+Enter</kbd>{' '}
              for new line &middot; {t('chat.scopeLabel')}:{' '}
              {enabledExchanges.length === 0 ? t('chat.noExchangeScope') : enabledExchanges.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {docManagementOpen && (
        <DocManagementModal
          documents={documents}
          onClose={() => setDocManagementOpen(false)}
          onDelete={handleDocumentDelete}
          onAdd={handleDocumentAdd}
          onUpdate={handleDocumentUpdate}
          onRefreshExchanges={refreshExchanges}
        />
      )}
    </div>
  )
}
