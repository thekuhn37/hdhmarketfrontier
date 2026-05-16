/**
 * API client for the license-policy backend service.
 *
 * When NEXT_PUBLIC_LICENSE_POLICY_API_BASE_URL is set, all calls go to the
 * real FastAPI backend.  When it is absent (or backend is unreachable), the
 * client falls back to mock data so the UI remains functional during
 * development without the backend running.
 *
 * To connect the real backend:
 *   1. Start backend:  cd license-policy-main && uv run api
 *   2. Set in .env.local:  NEXT_PUBLIC_LICENSE_POLICY_API_BASE_URL=http://localhost:8000
 *   3. Restart Next.js dev server.
 */

import type {
  ExchangeListResponse,
  DocumentListResponse,
  ChatRequest,
  ChatResponse,
  UploadResponse,
  DeleteResponse,
  ChatMessage,
  DocumentItem,
} from './types'
import { MOCK_EXCHANGES, MOCK_DOCUMENTS, getMockChatResponse } from './mock-data'
import {
  toExchangeListResponse,
  toDocumentListResponse,
  toChatResponse,
  toUploadResponse,
  toDeleteResponse,
  type BackendExchangeListResponse,
  type BackendDocumentListResponse,
  type BackendChatResponse,
  type BackendUploadResponse,
  type BackendDeleteResponse,
} from './transformers'

const API_BASE = process.env.NEXT_PUBLIC_LICENSE_POLICY_API_BASE_URL?.replace(/\/$/, '')

function isConfigured(): boolean {
  return Boolean(API_BASE)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, `${init?.method ?? 'GET'} ${path} failed: ${text}`)
  }
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Exchanges ────────────────────────────────────────────────────────────────

export async function getExchanges(): Promise<ExchangeListResponse> {
  if (!isConfigured()) {
    await delay(400)
    return { exchanges: MOCK_EXCHANGES, total: MOCK_EXCHANGES.length }
  }
  const raw = await apiFetch<BackendExchangeListResponse>('/api/exchanges')
  return toExchangeListResponse(raw)
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getDocuments(): Promise<DocumentListResponse> {
  if (!isConfigured()) {
    await delay(400)
    return { documents: MOCK_DOCUMENTS, total: MOCK_DOCUMENTS.length }
  }
  const raw = await apiFetch<BackendDocumentListResponse>('/api/documents')
  return toDocumentListResponse(raw)
}

export async function getDocumentById(id: string): Promise<DocumentItem> {
  if (!isConfigured()) {
    await delay(300)
    const found = MOCK_DOCUMENTS.find(d => d.id === id)
    if (!found) throw new ApiError(404, `Document ${id} not found`)
    return found
  }
  const raw = await apiFetch<BackendDocumentListResponse['documents'][0]>(`/api/documents/${id}`)
  // The single-document endpoint returns a DocumentResponse shape
  const { toDocumentItem } = await import('./transformers')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return toDocumentItem(raw as any)
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function sendLicenseQuestion(request: ChatRequest): Promise<ChatResponse> {
  if (!isConfigured()) {
    await delay(1200)
    return getMockChatResponse(request.question, request.enabledExchanges)
  }
  const raw = await apiFetch<BackendChatResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: request.question,
      enabled_exchanges: request.enabledExchanges,
    }),
  })
  return toChatResponse(raw)
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadDocument(file: File): Promise<UploadResponse> {
  if (!isConfigured()) {
    await delay(1200)
    const name = file.name.toLowerCase()
    const isCME = name.includes('cme')
    const isASX = name.includes('asx')
    return {
      documentId: `mock-${Date.now()}`,
      filename: file.name,
      exchange: isCME ? 'CME' : isASX ? 'ASX' : null,
      status: isCME || isASX ? 'processed' : 'parser_required',
      message:
        isCME || isASX
          ? 'Document uploaded and processed successfully.'
          : 'Document uploaded. No dedicated parser is available for this exchange.',
    }
  }
  const formData = new FormData()
  formData.append('file', file)
  const raw = await apiFetch<BackendUploadResponse>('/api/documents/upload', {
    method: 'POST',
    body: formData,
  })
  return toUploadResponse(raw)
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteDocument(id: string): Promise<DeleteResponse> {
  if (!isConfigured()) {
    await delay(400)
    return { success: true, documentId: id, message: 'Document removed successfully.' }
  }
  const raw = await apiFetch<BackendDeleteResponse>(`/api/documents/${id}`, {
    method: 'DELETE',
  })
  return toDeleteResponse(raw)
}

// ─── Export (frontend-side — preserves full multi-turn history) ───────────────
// The backend export endpoint only accepts a single Q&A pair.
// For a full conversation export we generate the file client-side.

export async function exportChatHistory(
  messages: ChatMessage[],
  enabledExchanges: string[],
  format: 'markdown' | 'json' = 'markdown',
): Promise<void> {
  const now = new Date()
  const dateSuffix = now.toISOString().slice(0, 10)
  const timeStr = now.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  const questionCount = messages.filter(m => m.role === 'user').length

  if (format === 'json') {
    const data = {
      platform: 'Data License Benchmark Platform',
      exportedAt: now.toISOString(),
      enabledExchanges,
      conversation: messages.map(m => ({
        role: m.role,
        timestamp: m.timestamp,
        content: m.content,
        citations: m.citations ?? [],
        confidence: m.confidence ?? null,
        scopeLabel: m.scopeLabel ?? null,
        disclaimer: m.disclaimer ?? null,
      })),
    }
    triggerDownload(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `license-benchmark-export-${dateSuffix}.json`,
    )
    return
  }

  // ── Markdown export ────────────────────────────────────────────────────────
  const lines: string[] = [
    '# Data License Benchmark Platform',
    '## Policy Analysis Export',
    '',
    '| | |',
    '|---|---|',
    `| **Exported** | ${timeStr} |`,
    `| **Exchanges** | ${enabledExchanges.join(', ') || 'None'} |`,
    `| **Questions** | ${questionCount} |`,
    '',
    '> **Research use only.** This export is for internal compliance analysis.',
    '> It does not constitute legal advice. Consult qualified legal counsel before making licensing decisions.',
    '',
    '---',
    '',
  ]

  let qNum = 0
  for (const msg of messages) {
    if (msg.role === 'user') {
      qNum++
      lines.push(
        `## Q${qNum}. ${msg.content}`,
        '',
        `*${new Date(msg.timestamp).toLocaleString()} · Asked by researcher*`,
      )
      if (msg.translatedFrom && msg.translatedText) {
        lines.push(`*Translated from ${msg.translatedFrom}: "${msg.translatedText}"*`)
      }
      lines.push('')
    } else {
      lines.push('### Answer', '')
      lines.push(msg.content, '')

      // Metadata
      const meta: string[] = []
      if (msg.confidence) meta.push(`**Confidence:** ${msg.confidence.toUpperCase()}`)
      if (msg.scopeLabel) meta.push(`**Scope:** ${msg.scopeLabel}`)
      if (meta.length) { lines.push(meta.join(' · '), '') }

      // Citations
      if (msg.citations?.length) {
        lines.push('### Policy Sources', '')
        msg.citations.forEach((c, i) => {
          const section = c.sectionTitle
            ? `§${c.sectionNumber} — ${c.sectionTitle}`
            : `§${c.sectionNumber}`
          lines.push(`**${i + 1}. [${c.exchange}] ${c.agreementTitle}**`)
          lines.push(`- Section: ${section}`)
          if (c.excerpt) lines.push(`- Excerpt:`, `  > "${c.excerpt}"`)
          if (c.page) lines.push(`- Page: ${c.page}`)
          lines.push('')
        })
      }

      // Disclaimer
      if (msg.disclaimer) {
        lines.push(`*${msg.disclaimer}*`, '')
      }

      lines.push('---', '')
    }
  }

  triggerDownload(
    new Blob([lines.join('\n')], { type: 'text/markdown' }),
    `license-benchmark-export-${dateSuffix}.md`,
  )
}

// ─── PDF Export (browser print-to-PDF) ───────────────────────────────────────

const PDF_EXCHANGE_COLORS: Record<string, string> = {
  CME:    '#1d4ed8',
  ASX:    '#047857',
  LSE:    '#6d28d9',
  NASDAQ: '#c2410c',
  HKEX:   '#b91c1c',
  NYSE:   '#3730a3',
  ICE:    '#0e7490',
  CBOE:   '#7c3aed',
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineToHtml(text: string): string {
  return escHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="code">$1</code>')
    .replace(/\[PERMITTED\]/g,   '<span class="verdict permitted">PERMITTED</span>')
    .replace(/\[PROHIBITED\]/g,  '<span class="verdict prohibited">PROHIBITED</span>')
    .replace(/\[CONDITIONAL\]/g, '<span class="verdict conditional">CONDITIONAL</span>')
}

function answerToHtml(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let inUl = false
  let inOl = false

  const flushList = () => {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) { flushList(); out.push('<div class="spacer"></div>'); continue }

    if (t.startsWith('### ')) { flushList(); out.push(`<h4 class="h4">${inlineToHtml(t.slice(4))}</h4>`); continue }
    if (t.startsWith('## '))  { flushList(); out.push(`<h3 class="h3">${inlineToHtml(t.slice(3))}</h3>`); continue }
    if (t.startsWith('# '))   { flushList(); out.push(`<h2 class="h2">${inlineToHtml(t.slice(2))}</h2>`); continue }
    if (/^---+$/.test(t))     { flushList(); out.push('<hr class="rule">'); continue }
    if (t.startsWith('> '))   { flushList(); out.push(`<blockquote class="bq">${inlineToHtml(t.slice(2))}</blockquote>`); continue }

    const bulletM = t.match(/^[-*+]\s+(.+)/)
    if (bulletM) {
      if (!inUl) { flushList(); out.push('<ul>'); inUl = true }
      out.push(`<li>${inlineToHtml(bulletM[1])}</li>`)
      continue
    }

    const numM = t.match(/^(\d+)[.)]\s+(.+)/)
    if (numM) {
      if (!inOl) { flushList(); out.push('<ol>'); inOl = true }
      out.push(`<li>${inlineToHtml(numM[2])}</li>`)
      continue
    }

    const secM = t.match(/^\[(Conclusion|Supporting Evidence|Conditions?|Exceptions?|Note|Warning|Interpretation)\](.*)/)
    if (secM) {
      flushList()
      const label = secM[1]
      const rest  = secM[2].trim()
      const cls = label === 'Conclusion' ? 'sec-badge conclusion'
        : (label.startsWith('Condition') || label.startsWith('Exception')) ? 'sec-badge condition'
        : label === 'Warning' ? 'sec-badge warning'
        : 'sec-badge evidence'
      out.push(`<div class="sec-row"><span class="${cls}">${escHtml(label)}</span>${rest ? `<span>${inlineToHtml(rest)}</span>` : ''}</div>`)
      continue
    }

    if (t.startsWith('Interpretation:')) {
      flushList()
      out.push(`<p class="interpretation">${inlineToHtml(t)}</p>`)
      continue
    }

    flushList()
    out.push(`<p>${inlineToHtml(t)}</p>`)
  }

  flushList()
  return out.join('\n')
}

export function exportChatHistoryPdf(messages: ChatMessage[], enabledExchanges: string[]): void {
  const now = new Date()
  const timeStr = now.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  const questionCount = messages.filter(m => m.role === 'user').length

  let bodyHtml = ''
  let qNum = 0

  for (const msg of messages) {
    if (msg.role === 'user') {
      qNum++
      const ts = new Date(msg.timestamp).toLocaleString()
      const translation = (msg.translatedFrom && msg.translatedText)
        ? `<p class="msg-meta">Translated from ${escHtml(msg.translatedFrom)}: &ldquo;${escHtml(msg.translatedText)}&rdquo;</p>`
        : ''
      bodyHtml += `
        <div class="question-block">
          <h2 class="question-heading">Q${qNum}. ${escHtml(msg.content)}</h2>
          <p class="msg-meta">${ts}</p>
          ${translation}
        </div>`
    } else {
      const confidence = msg.confidence
        ? `<span class="conf-badge conf-${msg.confidence}">${msg.confidence.toUpperCase()} CONFIDENCE</span>`
        : ''
      const scopeLabel = msg.scopeLabel
        ? `<span class="scope-badge">${escHtml(msg.scopeLabel)}</span>`
        : ''

      // Citations HTML
      let citationsHtml = ''
      if (msg.citations?.length) {
        const cards = msg.citations.map((c, i) => {
          const badgeColor = PDF_EXCHANGE_COLORS[c.exchange] ?? '#1a202c'
          const excerpt = c.excerpt
            ? `<p class="cit-excerpt">&ldquo;${escHtml(c.excerpt.slice(0, 350))}${c.excerpt.length > 350 ? '…' : ''}&rdquo;</p>`
            : ''
          const secTitle = c.sectionTitle ? `<p class="cit-section-title">${escHtml(c.sectionTitle)}</p>` : ''
          return `
            <div class="citation-card">
              <div class="citation-header">
                <span class="exch-badge" style="background:${badgeColor}">${escHtml(c.exchange)}</span>
                <span class="cit-title">${escHtml(c.agreementTitle)}</span>
                <span class="cit-sec">&sect;${escHtml(c.sectionNumber)}</span>
                ${c.page ? `<span class="cit-page">p.${c.page}</span>` : ''}
              </div>
              <div class="citation-body">
                ${secTitle}
                ${excerpt}
              </div>
            </div>`
        }).join('')
        citationsHtml = `<div class="citations"><h3 class="citations-heading">Policy Sources</h3>${cards}</div>`
      }

      const disclaimer = msg.disclaimer
        ? `<p class="answer-disclaimer">${escHtml(msg.disclaimer)}</p>`
        : ''

      bodyHtml += `
        <div class="answer-block">
          <div class="answer-meta-row">${confidence}${scopeLabel}</div>
          <div class="answer-body">${answerToHtml(msg.content)}</div>
          ${citationsHtml}
          ${disclaimer}
        </div>
        <hr class="qa-rule">`
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Data License Benchmark — Policy Analysis</title>
<style>
  @page { margin: 2cm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Georgia', serif; font-size: 11pt; line-height: 1.65; color: #1a202c; }

  /* Header */
  .doc-header { border-bottom: 2px solid #1a202c; padding-bottom: 14px; margin-bottom: 20px; }
  .doc-header h1 { font-size: 18pt; margin: 0 0 2px; letter-spacing: -0.02em; }
  .doc-header .subtitle { font-size: 9.5pt; color: #4a5568; margin: 0; }
  .meta-table { border-collapse: collapse; font-size: 9pt; margin: 12px 0; }
  .meta-table td { padding: 2px 16px 2px 0; vertical-align: top; }
  .meta-table td:first-child { font-weight: bold; color: #718096; white-space: nowrap; }
  .disclaimer-box { background: #fffbeb; border-left: 3px solid #d97706; padding: 8px 12px; font-size: 9pt; color: #78350f; margin: 14px 0 22px; page-break-inside: avoid; }

  /* Questions */
  .question-block { margin-top: 28px; page-break-after: avoid; }
  .question-heading { font-size: 13pt; margin: 0 0 4px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; }
  .msg-meta { font-size: 8.5pt; color: #718096; margin: 2px 0 0; font-style: italic; }

  /* Answers */
  .answer-block { margin: 8px 0 12px; }
  .answer-meta-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
  .conf-badge { font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 7px; border-radius: 20px; }
  .conf-high    { background: #d1fae5; color: #065f46; }
  .conf-medium  { background: #fef3c7; color: #92400e; }
  .conf-low     { background: #fee2e2; color: #991b1b; }
  .conf-unknown { background: #f1f5f9; color: #64748b; }
  .scope-badge { font-size: 8pt; border: 1px solid #e2e8f0; padding: 2px 7px; border-radius: 20px; color: #4a5568; }

  /* Answer body */
  .answer-body p { margin: 5px 0; }
  .answer-body h2 { font-size: 13pt; font-weight: bold; margin: 14px 0 6px; }
  .answer-body h3 { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 12px 0 5px; }
  .answer-body h4 { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.07em; color: #718096; margin: 10px 0 3px; }
  .answer-body ul, .answer-body ol { margin: 5px 0 5px 20px; }
  .answer-body li { margin: 3px 0; }
  .answer-body .bq { border-left: 2px solid #93c5fd; padding-left: 10px; color: #4a5568; font-style: italic; margin: 6px 0; }
  .answer-body .rule { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
  .answer-body .code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
  .answer-body .spacer { height: 6px; }
  .verdict { font-size: 8pt; font-weight: bold; text-transform: uppercase; padding: 1px 5px; border-radius: 3px; }
  .permitted   { background: #d1fae5; color: #065f46; }
  .prohibited  { background: #fee2e2; color: #991b1b; }
  .conditional { background: #fef3c7; color: #92400e; }
  .sec-row { display: flex; align-items: flex-start; gap: 8px; margin: 10px 0 4px; }
  .sec-badge { flex-shrink: 0; font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 3px; color: white; margin-top: 1px; }
  .sec-badge.conclusion { background: #1a202c; }
  .sec-badge.evidence   { background: #1e3a5f; }
  .sec-badge.condition  { background: #92400e; }
  .sec-badge.warning    { background: #991b1b; }
  .interpretation { border-left: 2px solid #93c5fd; padding-left: 10px; font-style: italic; color: #4a5568; margin: 6px 0; }

  /* Citations */
  .citations { margin-top: 16px; page-break-inside: avoid; }
  .citations-heading { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.07em; color: #718096; margin: 0 0 8px; }
  .citation-card { border: 1px solid #e2e8f0; border-radius: 5px; margin-bottom: 8px; page-break-inside: avoid; overflow: hidden; }
  .citation-header { display: flex; align-items: center; gap: 8px; padding: 5px 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 9pt; flex-wrap: wrap; }
  .exch-badge { font-size: 8pt; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; color: white; white-space: nowrap; }
  .cit-title { font-weight: 500; color: #2d3748; flex: 1; min-width: 0; }
  .cit-sec  { font-family: monospace; font-size: 8pt; color: #718096; background: #edf2f7; padding: 1px 5px; border-radius: 2px; white-space: nowrap; }
  .cit-page { font-size: 8pt; color: #718096; white-space: nowrap; }
  .citation-body { padding: 8px 10px; font-size: 10pt; }
  .cit-section-title { font-weight: bold; margin: 0 0 4px; font-size: 10pt; }
  .cit-excerpt { font-style: italic; color: #4a5568; border-left: 2px solid #93c5fd; padding-left: 8px; margin: 4px 0 0; font-size: 10pt; }

  /* Separators */
  .qa-rule { border: none; border-top: 1.5px solid #e2e8f0; margin: 20px 0; }
  .answer-disclaimer { font-size: 8.5pt; color: #a0aec0; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 14px; }

  @media print {
    .question-block { page-break-before: auto; }
    .citation-card  { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="doc-header">
  <h1>Data License Benchmark Platform</h1>
  <p class="subtitle">Policy Analysis Export</p>
</div>
<table class="meta-table">
  <tr><td>Exported</td><td>${escHtml(timeStr)}</td></tr>
  <tr><td>Exchanges</td><td>${escHtml(enabledExchanges.join(', ') || 'None')}</td></tr>
  <tr><td>Questions</td><td>${questionCount}</td></tr>
</table>
<div class="disclaimer-box">
  <strong>Research use only.</strong> This export is for internal compliance analysis and does not constitute legal advice.
  Consult qualified legal counsel before making licensing decisions.
</div>
${bodyHtml}
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Pop-up blocked. Please allow pop-ups for this site to export as PDF.')
    return
  }
  w.document.write(html)
  w.document.close()
}

// ─── Translation ──────────────────────────────────────────────────────────────

export interface TranslationResult {
  translatedText: string
  originalLanguage: string
  wasTranslated: boolean
}

export async function translateToEnglish(text: string): Promise<TranslationResult> {
  const res = await fetch('/api/data-license-benchmark/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) return { translatedText: text, originalLanguage: 'en', wasTranslated: false }
  return res.json() as Promise<TranslationResult>
}

/** Translate an English text into the given ISO-639-1 target language. */
export async function translateToLanguage(text: string, targetLanguage: string): Promise<string> {
  if (!targetLanguage || targetLanguage === 'en') return text
  try {
    const res = await fetch('/api/data-license-benchmark/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage }),
    })
    if (!res.ok) return text
    const json = await res.json() as { translatedText: string }
    return json.translatedText ?? text
  } catch {
    return text
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function delay(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
