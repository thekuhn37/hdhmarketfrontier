export type DocumentStatus =
  | 'processed'
  | 'processing'
  | 'parser_required'
  | 'unsupported'
  | 'failed'
  | 'pending'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown'

export interface ExchangeItem {
  id: string
  name: string
  code: string
  description: string
  enabled: boolean
  status: 'active' | 'inactive'
  agreementTypes: string[]
}

export interface Citation {
  citationId: string
  exchange: string
  agreementTitle: string
  sectionNumber: string
  sectionTitle: string
  excerpt: string
  relevanceScore?: number
  documentId?: string
  page?: number
}

export interface ClassificationResult {
  verdict: 'permitted' | 'prohibited' | 'conditional' | null
  riskLevel: 'low' | 'medium' | 'high' | 'unknown'
  policyArea: string | null
  tags: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: Citation[]
  confidence?: ConfidenceLevel
  disclaimer?: string
  classification?: ClassificationResult
  warnings?: string[]
  translatedFrom?: string
  translatedText?: string
  /** e.g. "Focused on ASX" or "Comparison: CME + ASX" — set when exchange detection fires */
  scopeLabel?: string
}

export interface DocumentItem {
  id: string
  title: string
  exchange: string
  agreementType: string
  status: DocumentStatus
  addedDate: Date
  fileName: string
  fileSize?: number
  parserRequiredReason?: string
  errorMessage?: string
}

export interface ChatRequest {
  question: string
  enabledExchanges: string[]
}

export interface ChatResponse {
  answer: string
  citations: Citation[]
  confidence: ConfidenceLevel
  disclaimer: string
  classification?: ClassificationResult
  /** Backend warnings e.g. "No LLM provider configured." */
  warnings?: string[]
}

export interface ExchangeListResponse {
  exchanges: ExchangeItem[]
  total: number
}

export interface DocumentListResponse {
  documents: DocumentItem[]
  total: number
}

export interface UploadResponse {
  documentId: string
  filename: string
  exchange: string | null
  status: DocumentStatus
  message: string
}

export interface DeleteResponse {
  success: boolean
  documentId: string
  message: string
}
