from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel, Field

DISCLAIMER = (
    "This output is for research and compliance analysis purposes only "
    "and does not constitute legal advice. Always consult qualified legal "
    "counsel before making licensing decisions."
)


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    """A traceable link: answer → policy source → original document."""
    citation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exchange: str
    agreement_type: str
    document_id: str | None = None       # links to DocumentResponse.id in registry
    document_title: str | None = None    # ExchangePolicy.agreement_title
    filename: str | None = None          # PDF filename in data/raw/
    section: str | None = None           # section number e.g. "2.12"
    clause: str | None = None            # sub-clause label if available
    title: str | None = None             # section heading
    excerpt: str | None = None           # source text supporting the answer
    page: int | None = None
    relevance_score: float | None = None  # 0.0–1.0; null = not computed


class ClassificationResult(BaseModel):
    """Structured verdict derived from matched use policies."""
    verdict: str | None = None           # permitted | prohibited | conditional
    topic: str | None = None             # inferred topic e.g. "cfd_creation"
    policy_area: str | None = None       # fee_structure | compliance | termination | …
    risk_level: Literal["low", "medium", "high", "unknown"] = "unknown"
    tags: list[str] = []


class RelatedSection(BaseModel):
    exchange: str
    agreement_type: str
    section: str
    title: str
    page: int | None = None


class ChatMetadata(BaseModel):
    llm_provider: str | None = None
    model: str | None = None
    used_noop_provider: bool = True
    latency_ms: float | None = None


# ---------------------------------------------------------------------------
# Request / Response
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=2000)
    enabled_exchanges: list[str] = Field(
        default_factory=list,
        description=(
            "Restrict search to these exchanges. "
            "Empty list = all loaded exchanges."
        ),
    )


class ChatResponse(BaseModel):
    answer: str
    summary: str | None = None           # one-sentence conclusion (null without LLM)
    enabled_exchanges: list[str]         # exchanges actually searched
    citations: list[Citation]
    related_sections: list[RelatedSection]
    classification: ClassificationResult
    warnings: list[str] = []
    llm_used: bool
    metadata: ChatMetadata
    disclaimer: str = DISCLAIMER
