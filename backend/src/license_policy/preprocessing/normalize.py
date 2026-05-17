"""Normalize parsed data into ExchangePolicy models."""

from __future__ import annotations

from ..models.schema import ExchangePolicy
from .asx_agreement_parser import parse_asx_agreement
from .asx_fees_parser import parse_asx_fees
from .asx_guide_parser import parse_asx_guide
from .cme_derived_parser import parse_cme_derived
from .cme_info_parser import parse_cme_information
from .generic_parser import _infer_exchange, parse_generic
from .pdf_extract import ExtractedDocument


def detect_agreement_type(doc: ExtractedDocument) -> str:
    """Detect agreement type from document content."""
    title_lower = doc.title.lower()
    full_lower = doc.full_text[:3000].lower()

    if "derived data" in title_lower or "derived data" in full_lower:
        return "derived_data"
    if "information license" in title_lower or "information license" in full_lower:
        return "information"
    if "product and services guide" in title_lower or "product and services guide" in full_lower:
        return "asx_product_guide"
    if "schedule of fees" in title_lower or "schedule of fees" in full_lower:
        return "asx_fee_schedule"
    if "marketsource" in title_lower or "marketsource" in full_lower:
        if "general terms and conditions" in full_lower:
            return "asx_marketsource_agreement"
    return "generic"


def normalize(doc: ExtractedDocument, agreement_type: str | None = None) -> ExchangePolicy:
    """Convert an extracted document into an ExchangePolicy model.

    If agreement_type is not provided, it is auto-detected from the document content.
    Exchange-specific parsers are only used when the document's exchange matches —
    this prevents CME parsers from being applied to LSE/ASX documents that happen
    to mention keywords like "derived data".
    """
    if agreement_type is None:
        agreement_type = detect_agreement_type(doc)

    inferred_exchange = _infer_exchange(doc)

    # CME-specific parsers — only applied when the document is actually from CME
    if inferred_exchange == "CME":
        if agreement_type == "derived_data":
            return parse_cme_derived(doc)
        if agreement_type == "information":
            return parse_cme_information(doc)

    # ASX-specific parsers
    if inferred_exchange == "ASX":
        if agreement_type == "asx_product_guide":
            return parse_asx_guide(doc)
        if agreement_type == "asx_fee_schedule":
            return parse_asx_fees(doc)
        if agreement_type == "asx_marketsource_agreement":
            return parse_asx_agreement(doc)

    return parse_generic(doc)
