"""Chat / question-answering engine.

Flow:
  1. Determine which exchanges to search (all loaded, or filtered by user).
  2. Gather evidence from PolicyStore:
     - search_policies() with keyword extraction (BUG-001 fix)
     - check_use() for use-policy matching
  3. Build structured context for LLM.
  4. If LLM available: synthesise natural-language answer grounded in context.
     If not: return structured evidence directly.
  5. Derive citations (with document_id, filename, document_title), classification,
     confidence, warnings, and timing metadata.
"""
from __future__ import annotations

import logging
import re
import time

from license_policy.server.data_store import PolicyStore

from ..schemas.chat import (
    DISCLAIMER,
    ChatMetadata,
    ChatRequest,
    ChatResponse,
    Citation,
    ClassificationResult,
    RelatedSection,
)
from ..services.llm.base import LLMProvider

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Stop-words excluded from keyword extraction
# ---------------------------------------------------------------------------
_STOP_WORDS = {
    "the", "and", "for", "are", "can", "use", "with", "this", "that",
    "from", "have", "what", "how", "which", "when", "will", "any", "all",
    "not", "does", "been", "being", "could", "would", "should", "make",
    "under", "into", "also", "does", "where", "there", "their", "about",
    "more", "than", "then", "such", "each", "only", "but", "its", "per",
}

# ---------------------------------------------------------------------------
# Policy-area keyword map
# ---------------------------------------------------------------------------
_POLICY_AREA_MAP: list[tuple[list[str], str]] = [
    (["fee", "cost", "price", "payment", "rate", "tier"], "fee_structure"),
    (["audit", "compliance", "record", "obligation", "reporting"], "compliance"),
    (["terminat", "cancel", "end", "expir", "wind-down", "winddown"], "termination"),
    (["redistribut", "resell", "sublicens", "transfer"], "redistribution"),
    (["derived", "index", "etf", "etp", "benchmark", "new original"], "derived_data"),
    (["display", "non-display", "non display", "wall", "datafeed"], "data_usage"),
    (["cfd", "leveraged", "spread", "binary", "warrant"], "prohibited_instruments"),
    (["suspend", "suspension", "restrict"], "suspension"),
    (["liability", "indemnif", "cap", "damages"], "liability"),
]

# ---------------------------------------------------------------------------
# LLM system prompt
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """You are a financial licensing compliance analyst for the \
Data License Benchmark Platform. Your role is to provide accurate, \
evidence-based answers about exchange data license policies.

STRICT RULES:
1. Answer ONLY using the Policy Context section provided. Do not use \
outside or prior knowledge.
2. For every factual claim cite the source with [Exchange – Agreement type, \
Section X.X] inline.
3. If the context does not contain the answer, say exactly: \
"The loaded agreements do not address this topic specifically."
4. If a use is PROHIBITED, state it clearly and cite the prohibition.
5. If a use has CONDITIONS, list every condition.
6. Mark your own interpretation with the prefix "Interpretation:".
7. Use "unknown" rather than guessing when uncertain.
8. Never provide legal advice. This is for research and compliance analysis only.
9. Structure your answer: [Conclusion] → [Supporting Evidence] → \
[Conditions or Exceptions].
10. Be concise. Aim for 3–6 paragraphs."""


# ---------------------------------------------------------------------------
# DocumentLookup type
# ---------------------------------------------------------------------------
# Callable: (exchange: str, agreement_type: str) -> (doc_id | None, filename | None)
DocumentLookup = dict[tuple[str, str], tuple[str | None, str | None, str | None]]
# key: (exchange.lower(), agreement_type)
# value: (doc_id, filename, agreement_title)


# ---------------------------------------------------------------------------
# ChatService
# ---------------------------------------------------------------------------

class ChatService:
    def __init__(
        self,
        store: PolicyStore,
        llm: LLMProvider,
        doc_lookup: DocumentLookup | None = None,
    ) -> None:
        self._store = store
        self._llm = llm
        self._doc_lookup = doc_lookup or {}

    async def answer(self, req: ChatRequest) -> ChatResponse:
        t_start = time.monotonic()

        available = list(self._store.list_exchanges().keys())
        if req.enabled_exchanges:
            target = [e.lower() for e in req.enabled_exchanges if e.lower() in available]
        else:
            target = available

        # Collect warnings
        warnings: list[str] = []
        if req.enabled_exchanges:
            missing = [e for e in req.enabled_exchanges if e.lower() not in available]
            if missing:
                warnings.append(
                    f"Exchange(s) not found in loaded agreements: {', '.join(missing)}"
                )
        if not self._llm.is_available:
            warnings.append(
                "No LLM provider is configured. "
                "Set ANTHROPIC_API_KEY in .env for natural-language answers."
            )

        if not target:
            return self._no_data_response(req.question, req.enabled_exchanges, warnings)

        evidence = self._gather_evidence(req.question, target)
        citations = self._extract_citations(evidence)
        related = self._extract_related_sections(evidence)
        classification = self._classify(evidence, req.question)
        context = self._build_context(evidence)

        if self._llm.is_available and context.strip():
            user_msg = (
                f"Question: {req.question}\n\n"
                f"Policy Context:\n{context}\n\n"
                "Please provide a structured answer with inline citations."
            )
            try:
                answer_text = await self._llm.complete(_SYSTEM_PROMPT, user_msg)
                summary = answer_text.split(".")[0] + "." if answer_text else None
                confidence = "high" if citations else "low"
                llm_used = True
            except Exception as exc:
                logger.error("LLM call failed: %s", exc)
                answer_text = self._format_fallback(evidence, req.question)
                summary = None
                confidence = "medium"
                llm_used = False
                warnings.append(f"LLM call failed: {exc}")
        else:
            answer_text = self._format_fallback(evidence, req.question)
            summary = None
            confidence = "medium" if citations else "unknown"
            llm_used = False

        latency_ms = round((time.monotonic() - t_start) * 1000, 1)

        return ChatResponse(
            answer=answer_text,
            summary=summary,
            enabled_exchanges=[t.upper() for t in target],
            citations=citations,
            related_sections=related,
            classification=classification,
            warnings=warnings,
            llm_used=llm_used,
            metadata=ChatMetadata(
                llm_provider=self._llm.provider_name,
                model=self._llm.provider_name if self._llm.is_available else None,
                used_noop_provider=not self._llm.is_available,
                latency_ms=latency_ms,
            ),
            disclaimer=DISCLAIMER,
        )

    # ------------------------------------------------------------------
    # Evidence gathering — BUG-001 fix: keyword extraction + dedup
    # ------------------------------------------------------------------

    def _gather_evidence(self, question: str, exchanges: list[str]) -> list[dict]:
        keywords = _extract_keywords(question)
        # Full question first, then individual keywords for broader coverage
        search_terms = [question] + keywords

        results = []
        for ex in exchanges:
            seen: set[tuple[str, str]] = set()
            search_hits: list[dict] = []

            for term in search_terms:
                for hit in self._store.search_policies(term, exchange=ex):
                    key = (hit["agreement_type"], hit["section"])
                    if key not in seen:
                        seen.add(key)
                        search_hits.append(hit)

            use_hits = self._store.check_use(ex, question)
            if search_hits or use_hits:
                results.append({
                    "exchange": ex.upper(),
                    "search_hits": search_hits[:6],
                    "use_hits": use_hits[:10],
                })
        return results

    # ------------------------------------------------------------------
    # Context builder
    # ------------------------------------------------------------------

    def _build_context(self, evidence: list[dict]) -> str:
        parts: list[str] = []
        for ev in evidence:
            parts.append(f"\n{'=' * 60}")
            parts.append(f"EXCHANGE: {ev['exchange']}")
            parts.append("=" * 60)

            if ev["use_hits"]:
                parts.append("\n[USE POLICIES]")
                for hit in ev["use_hits"]:
                    cls = hit["classification"].upper()
                    parts.append(f"\n[{cls}] {hit['description']}")
                    if hit.get("source_section"):
                        parts.append(
                            f"  Source: {hit['agreement_type']}, Section {hit['source_section']}"
                        )
                    for cond in hit.get("conditions", []):
                        parts.append(f"  Condition: {cond}")

            if ev["search_hits"]:
                parts.append("\n[RELEVANT SECTIONS]")
                for hit in ev["search_hits"]:
                    parts.append(
                        f"\nSection {hit['section']} – {hit['title']} "
                        f"({hit['agreement_type']}, page {hit.get('page', 'N/A')})"
                    )
                    parts.append(hit["excerpt"])

        return "\n".join(parts) if parts else ""

    # ------------------------------------------------------------------
    # Fallback (no LLM)
    # ------------------------------------------------------------------

    def _format_fallback(self, evidence: list[dict], question: str) -> str:
        if not evidence:
            return (
                "No relevant policy information was found for your question "
                "in the currently loaded agreements. "
                "Ensure the relevant exchange PDFs have been preprocessed."
            )
        lines = [
            "The following structured policy data was found. "
            "Configure an LLM provider (ANTHROPIC_API_KEY) for natural-language answers.\n"
        ]
        for ev in evidence:
            lines.append(f"\n### {ev['exchange']}")
            if ev["use_hits"]:
                lines.append("**Use Policies:**")
                for hit in ev["use_hits"]:
                    cls = hit["classification"].upper()
                    src = f" (Section {hit['source_section']})" if hit.get("source_section") else ""
                    lines.append(f"- [{cls}]{src} {hit['description']}")
            if ev["search_hits"]:
                lines.append("**Relevant Sections:**")
                for hit in ev["search_hits"]:
                    lines.append(
                        f"- Section {hit['section']} ({hit['title']}): {hit['excerpt'][:200]}..."
                    )
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Citation extraction — BUG-002 + BUG-003 fixes
    # ------------------------------------------------------------------

    def _extract_citations(self, evidence: list[dict]) -> list[Citation]:
        citations: list[Citation] = []
        seen: set[tuple] = set()

        for ev in evidence:
            # Use-policy hits — direct classification evidence
            for hit in ev["use_hits"]:
                sec = hit.get("source_section")
                key = (ev["exchange"], hit["agreement_type"], sec)
                if key not in seen:
                    seen.add(key)
                    # Look up document metadata
                    doc_id, filename, doc_title = self._lookup_doc(
                        ev["exchange"], hit["agreement_type"]
                    )
                    citations.append(Citation(
                        exchange=ev["exchange"],
                        agreement_type=hit["agreement_type"],
                        document_id=doc_id,
                        document_title=doc_title,
                        filename=filename,
                        section=sec,
                        title=hit.get("description", "")[:120],
                        # BUG-003 fix: use description as excerpt so there's always source text
                        excerpt=hit.get("description"),
                        relevance_score=1.0,  # direct match = highest relevance
                    ))

            # Full-text search hits — contextual evidence
            for hit in ev["search_hits"]:
                key = (ev["exchange"], hit["agreement_type"], hit["section"])
                if key not in seen:
                    seen.add(key)
                    doc_id, filename, doc_title = self._lookup_doc(
                        ev["exchange"], hit["agreement_type"]
                    )
                    citations.append(Citation(
                        exchange=ev["exchange"],
                        agreement_type=hit["agreement_type"],
                        document_id=doc_id,
                        document_title=doc_title,
                        filename=filename,
                        section=hit["section"],
                        title=hit.get("title"),
                        excerpt=hit.get("excerpt", "")[:500],
                        page=hit.get("page"),
                        relevance_score=0.8,
                    ))

        return citations

    def _extract_related_sections(self, evidence: list[dict]) -> list[RelatedSection]:
        sections: list[RelatedSection] = []
        seen: set[tuple] = set()
        for ev in evidence:
            for hit in ev["search_hits"]:
                key = (ev["exchange"], hit["agreement_type"], hit["section"])
                if key not in seen:
                    seen.add(key)
                    sections.append(RelatedSection(
                        exchange=ev["exchange"],
                        agreement_type=hit["agreement_type"],
                        section=hit["section"],
                        title=hit.get("title", ""),
                        page=hit.get("page"),
                    ))
        return sections

    # ------------------------------------------------------------------
    # Classification — now returns ClassificationResult
    # ------------------------------------------------------------------

    def _classify(self, evidence: list[dict], question: str) -> ClassificationResult:
        classifications: set[str] = set()
        for ev in evidence:
            for hit in ev["use_hits"]:
                classifications.add(hit["classification"])

        if not classifications:
            verdict = None
            risk_level = "unknown"
        elif "prohibited" in classifications:
            verdict = "prohibited"
            risk_level = "high"
        elif classifications == {"permitted"}:
            verdict = "permitted"
            risk_level = "low"
        else:
            verdict = "conditional"
            risk_level = "medium"

        policy_area = _detect_policy_area(question)

        return ClassificationResult(
            verdict=verdict,
            topic=None,
            policy_area=policy_area,
            risk_level=risk_level,  # type: ignore[arg-type]
            tags=list(classifications) if classifications else [],
        )

    # ------------------------------------------------------------------
    # Document lookup helper
    # ------------------------------------------------------------------

    def _lookup_doc(
        self, exchange: str, agreement_type: str
    ) -> tuple[str | None, str | None, str | None]:
        """Return (doc_id, filename, agreement_title) from the doc_lookup map."""
        key = (exchange.lower(), agreement_type)
        return self._doc_lookup.get(key, (None, None, None))

    # ------------------------------------------------------------------
    # No-data edge case
    # ------------------------------------------------------------------

    def _no_data_response(
        self, question: str, requested: list[str], warnings: list[str]
    ) -> ChatResponse:
        if requested:
            msg = (
                f"None of the requested exchanges ({', '.join(requested)}) "
                "have loaded agreements. Please preprocess their PDFs first."
            )
        else:
            msg = (
                "No exchange agreements are currently loaded. "
                "Run the preprocessing pipeline first: uv run preprocess ..."
            )
        return ChatResponse(
            answer=msg,
            summary=None,
            enabled_exchanges=[],
            citations=[],
            related_sections=[],
            classification=ClassificationResult(risk_level="unknown"),
            warnings=warnings,
            llm_used=False,
            metadata=ChatMetadata(
                used_noop_provider=not self._llm.is_available,
            ),
            disclaimer=DISCLAIMER,
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_keywords(query: str) -> list[str]:
    """Extract significant single-word search terms from a query."""
    words = re.sub(r"[^a-z\s]", " ", query.lower()).split()
    return [w for w in words if len(w) > 3 and w not in _STOP_WORDS]


def _detect_policy_area(question: str) -> str | None:
    q = question.lower()
    for keywords, area in _POLICY_AREA_MAP:
        if any(kw in q for kw in keywords):
            return area
    return None
