import type { ExchangeItem, DocumentItem, ChatResponse, Citation } from './types'

export const MOCK_EXCHANGES: ExchangeItem[] = [
  {
    id: 'cme',
    name: 'CME Group',
    code: 'CME',
    description: 'Derived Data License · Information License',
    enabled: true,
    status: 'active',
    agreementTypes: ['Derived Data License', 'Information License'],
  },
  {
    id: 'asx',
    name: 'Australian Securities Exchange',
    code: 'ASX',
    description: 'MarketSource Agreement · Product & Services Guide · Fee Schedule',
    enabled: true,
    status: 'active',
    agreementTypes: ['MarketSource Agreement', 'Product & Services Guide', 'Fee Schedule'],
  },
]

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    title: 'CME Derived Data License Agreement',
    exchange: 'CME',
    agreementType: 'Derived Data License',
    status: 'processed',
    addedDate: new Date('2025-11-01'),
    fileName: 'CME-derived-data-license-agreement.pdf',
    fileSize: 245760,
  },
  {
    id: 'doc-002',
    title: 'CME Information License Agreement',
    exchange: 'CME',
    agreementType: 'Information License',
    status: 'processed',
    addedDate: new Date('2025-11-01'),
    fileName: 'CME_information-license-agreement-september-2024.pdf',
    fileSize: 312320,
  },
  {
    id: 'doc-003',
    title: 'ASX MarketSource Agreement',
    exchange: 'ASX',
    agreementType: 'MarketSource Agreement',
    status: 'processed',
    addedDate: new Date('2025-11-01'),
    fileName: 'ASX_marketsource-agreement.pdf',
    fileSize: 198656,
  },
  {
    id: 'doc-004',
    title: 'ASX Market Information Product & Services Guide',
    exchange: 'ASX',
    agreementType: 'Product & Services Guide',
    status: 'processed',
    addedDate: new Date('2025-11-01'),
    fileName: 'ASX_market-information-product-and-services-guide.pdf',
    fileSize: 276480,
  },
  {
    id: 'doc-005',
    title: 'ASX Information & Technical Services Fee Schedule',
    exchange: 'ASX',
    agreementType: 'Fee Schedule',
    status: 'processed',
    addedDate: new Date('2025-11-01'),
    fileName: 'ASX_Information-and-Technical-Services-Fee-schedule.pdf',
    fileSize: 143360,
  },
]

const DISCLAIMER =
  'This output is for research and compliance analysis purposes only and does not constitute legal advice.'

const CME_DERIVED_CITATIONS: Citation[] = [
  {
    citationId: 'cit-001',
    exchange: 'CME',
    agreementTitle: 'CME Derived Data License Agreement',
    sectionNumber: '2.1',
    sectionTitle: 'Derived Data Definition and Permitted Use',
    excerpt:
      'Subscriber may create Derived Data from Market Data provided that such Derived Data is not a Substitute for the original Market Data. CFD products based directly on CME benchmark prices require separate Derived Data licensing approval.',
    relevanceScore: 0.95,
  },
  {
    citationId: 'cit-002',
    exchange: 'CME',
    agreementTitle: 'CME Derived Data License Agreement',
    sectionNumber: '3.4',
    sectionTitle: 'Prohibited Uses',
    excerpt:
      'Subscriber shall not use Market Data to create financial instruments, indices, or products that replicate CME benchmark prices without prior written approval from CME Group.',
    relevanceScore: 0.88,
  },
  {
    citationId: 'cit-003',
    exchange: 'CME',
    agreementTitle: 'CME Information License Agreement',
    sectionNumber: '5.2',
    sectionTitle: 'Redistributor Obligations',
    excerpt:
      'Any product or service incorporating CME Market Data in a financial instrument context must be separately licensed under the CME Derived Data License and approved in writing.',
    relevanceScore: 0.82,
  },
]

const CME_AUDIT_CITATIONS: Citation[] = [
  {
    citationId: 'cit-004',
    exchange: 'CME',
    agreementTitle: 'CME Information License Agreement',
    sectionNumber: '6.1',
    sectionTitle: 'Audit Rights',
    excerpt:
      'CME may audit Licensee systems, records and facilities upon 30 days written notice. Licensee shall maintain complete and accurate records of all Market Data usage for a minimum period of three years.',
    relevanceScore: 1.0,
  },
]

const ASX_AUDIT_CITATIONS: Citation[] = [
  {
    citationId: 'cit-005',
    exchange: 'ASX',
    agreementTitle: 'ASX MarketSource Agreement',
    sectionNumber: '8.3',
    sectionTitle: 'Record Keeping and Audit',
    excerpt:
      'Subscribers must retain records of all Market Information usage and permit ASX or its authorized representatives to audit such records upon reasonable written notice. Records must be retained for a minimum of 7 years.',
    relevanceScore: 1.0,
  },
]

const ASX_INDEX_CITATIONS: Citation[] = [
  {
    citationId: 'cit-006',
    exchange: 'ASX',
    agreementTitle: 'ASX Market Information Product & Services Guide',
    sectionNumber: '4.2',
    sectionTitle: 'Derived and Index Products',
    excerpt:
      'Creation of an index or benchmark product using ASX Market Information requires prior written consent from ASX and may require execution of a separate Derived Data License. Internal research indices may qualify for exemption subject to non-commercial use restrictions.',
    relevanceScore: 0.92,
  },
]

export function getMockChatResponse(
  question: string,
  enabledExchanges: string[],
): ChatResponse {
  const q = question.toLowerCase()
  const hasCME = enabledExchanges.includes('CME')
  const hasASX = enabledExchanges.includes('ASX')
  const exchangeLabel = enabledExchanges.join(' and ')

  if (q.includes('cfd') || q.includes('contract for difference')) {
    return {
      answer:
        'Based on the available structured policy data, CME data use for CFD product creation appears to be restricted or prohibited unless separately licensed and explicitly approved by CME Group in writing. The Derived Data License Agreement requires written approval for any financial instrument that replicates or closely tracks CME benchmark prices. You should review the cited derived data provisions and obtain formal exchange approval before proceeding with any CFD product design.',
      citations: hasCME ? CME_DERIVED_CITATIONS : [],
      confidence: 'medium',
      disclaimer: DISCLAIMER,
      classification: {
        verdict: 'conditional',
        riskLevel: 'high',
        policyArea: 'derived_data',
        tags: ['conditional', 'approval-required', 'derived-data'],
      },
    }
  }

  if (q.includes('audit')) {
    const parts: string[] = []
    const citations: Citation[] = []
    if (hasCME) {
      parts.push(
        'CME Group requires licensees to maintain auditable records of all market data usage and permit CME auditors to inspect premises, systems, and records upon 30 days written notice. Records must be retained for a minimum of three years.',
      )
      citations.push(...CME_AUDIT_CITATIONS)
    }
    if (hasASX) {
      parts.push(
        'ASX MarketSource Agreement Section 8 requires subscribers to maintain records for a minimum of 7 years and submit to audit upon reasonable written notice from ASX or its authorized representatives.',
      )
      citations.push(...ASX_AUDIT_CITATIONS)
    }
    return {
      answer:
        parts.join(' ') +
        ' Both exchanges impose significant audit obligations — ensure your compliance reporting systems and usage logs are audit-ready and correctly retained for the applicable retention period.',
      citations,
      confidence: 'high',
      disclaimer: DISCLAIMER,
      classification: {
        verdict: 'conditional',
        riskLevel: 'medium',
        policyArea: 'compliance',
        tags: ['audit', 'record-keeping', 'compliance'],
      },
    }
  }

  if (hasASX && (q.includes('fee') || q.includes('professional') || q.includes('real-time'))) {
    return {
      answer:
        'Based on the ASX Fee Schedule, professional real-time market data fees are structured on a per-user per-month basis and vary by data type (equities, derivatives, fixed income) and user classification (professional, non-professional, internal). Non-display or automated usage is billed separately under the ASX Non-Display License. Current schedules should be confirmed directly with ASX as fees are updated periodically.',
      citations: [],
      confidence: 'medium',
      disclaimer: DISCLAIMER,
      classification: {
        verdict: 'permitted',
        riskLevel: 'low',
        policyArea: 'fee_structure',
        tags: ['fee-schedule', 'professional', 'real-time'],
      },
    }
  }

  if (q.includes('index') || q.includes('benchmark')) {
    const citations: Citation[] = []
    if (hasCME) citations.push(...CME_DERIVED_CITATIONS.slice(0, 1))
    if (hasASX) citations.push(...ASX_INDEX_CITATIONS)
    return {
      answer: `Creating an index using ${exchangeLabel} market data is subject to Derived Data License requirements. Index creation that results in a product marketed externally or used as the basis for a financial instrument generally requires explicit written approval from the relevant exchange. Internal research indices may be permissible under standard license terms, subject to non-commercial use restrictions and specific agreement clauses.`,
      citations,
      confidence: 'medium',
      disclaimer: DISCLAIMER,
      classification: {
        verdict: 'conditional',
        riskLevel: 'medium',
        policyArea: 'derived_data',
        tags: ['index', 'benchmark', 'approval-required'],
      },
    }
  }

  if (q.includes('compar') || q.includes('between cme') || q.includes('cme and asx')) {
    return {
      answer: `Comparative analysis of ${exchangeLabel} licensing obligations: both exchanges share core compliance requirements (audit rights, usage reporting, redistribution controls) but differ in fee structures, notice periods, and derived data approval processes. CME operates a bilateral written-approval model for derived data products. ASX uses a tiered licensing structure aligned with the ASX MarketSource Agreement framework, with a 7-year record-retention requirement versus CME's 3-year minimum.`,
      citations: [...CME_AUDIT_CITATIONS, ...ASX_AUDIT_CITATIONS],
      confidence: 'medium',
      disclaimer: DISCLAIMER,
      classification: {
        verdict: null,
        riskLevel: 'unknown',
        policyArea: 'compliance',
        tags: ['comparison', 'multi-exchange'],
      },
    }
  }

  return {
    answer: `Based on the structured policy data available for ${exchangeLabel}, this question relates to licensing terms that require careful review of specific agreement sections. The general principle across market data license agreements is that any use beyond internal consumption — including redistribution, derived product creation, or external display — requires explicit contractual authorization. Review the cited sections and consult your legal team for specific use-case guidance.`,
    citations: hasCME ? [CME_DERIVED_CITATIONS[0]] : [],
    confidence: 'low',
    disclaimer: DISCLAIMER,
    classification: {
      verdict: 'conditional',
      riskLevel: 'medium',
      policyArea: null,
      tags: ['general', 'review-required'],
    },
  }
}
