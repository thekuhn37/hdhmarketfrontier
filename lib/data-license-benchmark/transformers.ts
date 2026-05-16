/**
 * Transformers between the license-policy backend (snake_case) and the
 * HDHMarketFrontier frontend (camelCase).
 *
 * Every function here is a pure transform — no fetch, no side-effects.
 * The backend schema is versioned at 0.2.0; keep these in sync when the
 * backend schema evolves.
 */

import type {
  ExchangeItem,
  DocumentItem,
  DocumentStatus,
  ChatResponse,
  Citation,
  ClassificationResult,
  ConfidenceLevel,
  UploadResponse,
  DeleteResponse,
} from './types'

// ─── Backend raw shapes (snake_case, from FastAPI) ─────────────────────────────
// These types mirror the Pydantic schemas in license_policy/api/schemas/.
// They are INTERNAL to this file — nothing else imports them.

interface BackendExchangeInfo {
  id: string
  name: string
  code: string
  enabled_by_default: boolean
  agreement_types: string[]
  product_families: string[]
  document_count: number
  processed_document_count: number
}

export interface BackendExchangeListResponse {
  exchanges: BackendExchangeInfo[]
  total: number
}

interface BackendDocumentResponse {
  id: string
  filename: string
  exchange: string | null
  agreement_type: string | null
  document_type: string | null
  uploaded_at: string
  processed_at: string | null
  status: string
  file_size: number | null
  error_message: string | null
  parser_required_reason: string | null
}

export interface BackendDocumentListResponse {
  documents: BackendDocumentResponse[]
  total: number
}

interface BackendCitation {
  citation_id: string
  exchange: string
  agreement_type: string
  document_id: string | null
  document_title: string | null
  filename: string | null
  section: string | null
  clause: string | null
  title: string | null
  excerpt: string | null
  page: number | null
  relevance_score: number | null
}

interface BackendClassification {
  verdict: string | null
  topic: string | null
  policy_area: string | null
  risk_level: 'low' | 'medium' | 'high' | 'unknown'
  tags: string[]
}

interface BackendChatMetadata {
  llm_provider: string | null
  model: string | null
  used_noop_provider: boolean
  latency_ms: number | null
}

export interface BackendChatResponse {
  answer: string
  summary: string | null
  enabled_exchanges: string[]
  citations: BackendCitation[]
  related_sections: unknown[]
  classification: BackendClassification
  warnings: string[]
  llm_used: boolean
  metadata: BackendChatMetadata
  disclaimer: string
}

export interface BackendUploadResponse {
  document_id: string
  filename: string
  exchange: string | null
  agreement_type: string | null
  status: string
  message: string
  next_action: string
}

export interface BackendDeleteResponse {
  success: boolean
  document_id: string
  message: string
}

// ─── Human-readable agreement type labels ────────────────────────────────────

const AGREEMENT_TYPE_LABELS: Record<string, string> = {
  derived_data: 'Derived Data License',
  information: 'Information License',
  product_guide: 'Product & Services Guide',
  fee_schedule: 'Fee Schedule',
  marketsource_agreement: 'MarketSource Agreement',
  redistribution: 'Redistribution Agreement',
}

function humanizeAgreementType(at: string | null | undefined): string {
  if (!at) return 'Unknown'
  return AGREEMENT_TYPE_LABELS[at] ?? at.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Exchange transformer ─────────────────────────────────────────────────────

export function toExchangeItem(e: BackendExchangeInfo): ExchangeItem {
  return {
    id: e.id,
    name: e.name,
    code: e.code,
    description: e.agreement_types.map(humanizeAgreementType).join(' · '),
    enabled: e.enabled_by_default,
    status: 'active',
    agreementTypes: e.agreement_types.map(humanizeAgreementType),
  }
}

export function toExchangeListResponse(raw: BackendExchangeListResponse) {
  return {
    exchanges: raw.exchanges.map(toExchangeItem),
    total: raw.total,
  }
}

// ─── Document transformer ─────────────────────────────────────────────────────

function deriveDocumentTitle(d: BackendDocumentResponse): string {
  if (d.document_type) return d.document_type
  if (d.agreement_type) return humanizeAgreementType(d.agreement_type)
  return d.filename.replace(/\.(pdf|PDF)$/, '').replace(/[-_]/g, ' ')
}

export function toDocumentItem(d: BackendDocumentResponse): DocumentItem {
  return {
    id: d.id,
    title: deriveDocumentTitle(d),
    exchange: d.exchange ?? 'Unknown',
    agreementType: d.document_type ?? humanizeAgreementType(d.agreement_type),
    status: d.status as DocumentStatus,
    addedDate: new Date(d.uploaded_at),
    fileName: d.filename,
    fileSize: d.file_size ?? undefined,
    parserRequiredReason: d.parser_required_reason ?? undefined,
    errorMessage: d.error_message ?? undefined,
  }
}

export function toDocumentListResponse(raw: BackendDocumentListResponse) {
  return {
    documents: raw.documents.map(toDocumentItem),
    total: raw.total,
  }
}

// ─── Confidence derivation ────────────────────────────────────────────────────
// The backend has no confidence field — derive from available signals.

function deriveConfidence(d: BackendChatResponse): ConfidenceLevel {
  if (d.citations.length === 0) return 'unknown'
  if (d.llm_used && d.classification.risk_level === 'low') return 'high'
  if (d.llm_used) return 'medium'
  if (d.citations.length >= 5) return 'medium'
  return 'low'
}

// ─── Citation transformer ─────────────────────────────────────────────────────

function toCitation(c: BackendCitation): Citation {
  return {
    citationId: c.citation_id,
    exchange: c.exchange,
    agreementTitle: c.document_title ?? humanizeAgreementType(c.agreement_type),
    sectionNumber: c.section ?? '',
    sectionTitle: c.title ?? '',
    excerpt: c.excerpt ?? '',
    relevanceScore: c.relevance_score ?? undefined,
    documentId: c.document_id ?? undefined,
    page: c.page ?? undefined,
  }
}

// ─── Classification transformer ───────────────────────────────────────────────

function toClassification(c: BackendClassification): ClassificationResult {
  return {
    verdict: c.verdict as ClassificationResult['verdict'],
    riskLevel: c.risk_level,
    policyArea: c.policy_area,
    tags: c.tags,
  }
}

// ─── Chat response transformer ────────────────────────────────────────────────

export function toChatResponse(raw: BackendChatResponse): ChatResponse {
  return {
    answer: raw.answer,
    citations: raw.citations.map(toCitation),
    confidence: deriveConfidence(raw),
    disclaimer: raw.disclaimer,
    classification: toClassification(raw.classification),
    warnings: raw.warnings,
  }
}

// ─── Upload / Delete transformers ─────────────────────────────────────────────

export function toUploadResponse(raw: BackendUploadResponse): UploadResponse {
  return {
    documentId: raw.document_id,
    filename: raw.filename,
    exchange: raw.exchange,
    status: raw.status as DocumentStatus,
    message: raw.message,
  }
}

export function toDeleteResponse(raw: BackendDeleteResponse): DeleteResponse {
  return {
    success: raw.success,
    documentId: raw.document_id,
    message: raw.message,
  }
}
