"""Generic fallback parser for exchanges without a dedicated structured parser.

Extracts all text sections from the PDF and creates a minimal ExchangePolicy so
the document is searchable in the policy store. Structured fields (use_policies,
fee_structure, etc.) are left empty — the LLM answers from the raw section text.
"""
from __future__ import annotations

import re

from ..models.enums import AgreementType
from ..models.schema import ExchangePolicy, Section
from .pdf_extract import ExtractedDocument


def _infer_agreement_type(doc: ExtractedDocument) -> AgreementType:
    t = (doc.title + " " + doc.full_text[:2000]).lower()
    if any(k in t for k in ("price list", "fee schedule", "schedule of fees", "tariff", "schedule a")):
        return AgreementType.fee_schedule
    if any(k in t for k in ("redistribution", "vendor", "resell", "sublicens")):
        return AgreementType.redistribution
    if any(k in t for k in ("product guide", "product and services", "services guide")):
        return AgreementType.product_guide
    if any(k in t for k in ("derived data", "index", "benchmark")):
        return AgreementType.derived_data
    # default: general information/terms agreement
    return AgreementType.information


def _infer_exchange(doc: ExtractedDocument) -> str:
    """Best-effort exchange detection from title and first page text."""
    _TOKENS = {
        "LSE": ["london stock exchange", "lse", "turquoise"],
        "NASDAQ": ["nasdaq"],
        "ICE": ["intercontinental exchange", "ice data"],
        "HKEX": ["hong kong exchange", "hkex"],
        "SGX": ["singapore exchange", "sgx"],
        "CBOE": ["cboe", "chicago board options"],
        "EUREX": ["eurex"],
        "TMX": ["tmx", "tsx"],
        "NYSE": ["new york stock exchange", "nyse"],
    }
    sample = (doc.title + " " + doc.full_text[:1500]).lower()
    for code, keywords in _TOKENS.items():
        if any(kw in sample for kw in keywords):
            return code
    return "UNKNOWN"


def parse_generic(doc: ExtractedDocument, exchange: str | None = None) -> ExchangePolicy:
    """Convert any ExtractedDocument into a searchable ExchangePolicy."""
    resolved_exchange = exchange or _infer_exchange(doc)
    agreement_type = _infer_agreement_type(doc)

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    # If the PDF extractor found no structured sections, fall back to splitting
    # the full text by numbered headings so the store still has searchable chunks.
    if not sections:
        chunks = re.split(r"\n(\d+(?:\.\d+)*)\s+([A-Z][^\n]{0,80})\n", doc.full_text)
        i = 1
        while i + 2 < len(chunks):
            number, title, body = chunks[i], chunks[i + 1], chunks[i + 2]
            sections.append(Section(number=number.strip(), title=title.strip(), text=body.strip()[:2000]))
            i += 3

    return ExchangePolicy(
        exchange=resolved_exchange,
        agreement_type=agreement_type,
        agreement_title=doc.title or f"{resolved_exchange} Market Data Agreement",
        sections=sections,
    )
