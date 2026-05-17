"""Normalize parsed data into ExchangePolicy models."""

from __future__ import annotations

from ..models.schema import ExchangePolicy
from .asx_agreement_parser import parse_asx_agreement
from .asx_fees_parser import parse_asx_fees
from .asx_guide_parser import parse_asx_guide
from .cme_derived_parser import parse_cme_derived
from .cme_info_parser import parse_cme_information
from .generic_parser import _infer_exchange, parse_generic
from .lse_policy_guidelines_parser import parse_lse_policy_guidelines
from .lse_schedule_a_parser import parse_lse_schedule_a
from .lse_schedule_b_parser import parse_lse_schedule_b
from .lse_tc_parser import parse_lse_terms_and_conditions
from .pdf_extract import ExtractedDocument


def detect_agreement_type(doc: ExtractedDocument) -> str:
    """Detect agreement type from document content."""
    title_lower = doc.title.lower()
    full_lower = doc.full_text[:3000].lower()

    # LSE-specific detection — check more-specific patterns before "terms and conditions"
    # since schedule docs mention T&C in their subtitle/annex line.
    _lse_doc = any(k in title_lower for k in ("london stock exchange", "turquoise")) or \
               "london stock exchange market data" in full_lower[:500]
    if _lse_doc:
        # Guidelines first (before generic "market data policy" check)
        if "policy guidelines" in title_lower or "policy guidance" in title_lower or \
           "policy guidelines" in full_lower[:500] or "policy guidance" in full_lower[:500]:
            return "lse_policy_guidelines"
        # Schedule B — "schedule b" appears in title or very early in text
        if "schedule b" in title_lower or "schedule b" in full_lower[:500] or \
           "market data policy" in title_lower:
            return "lse_market_data_policy"
        # Schedule A / Price List
        if "schedule a" in title_lower or "schedule a" in full_lower[:500] or \
           "price list and data products" in full_lower[:500]:
            return "lse_fee_schedule"
        # Terms & Conditions — checked last; PDF has trailing spaces so use substring not line match
        if "terms and conditions" in title_lower or \
           "terms and conditions" in full_lower[:500]:
            return "lse_terms_and_conditions"

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

    # LSE-specific parsers
    if inferred_exchange == "LSE":
        if agreement_type == "lse_terms_and_conditions":
            return parse_lse_terms_and_conditions(doc)
        if agreement_type == "lse_market_data_policy":
            return parse_lse_schedule_b(doc)
        if agreement_type == "lse_fee_schedule":
            return parse_lse_schedule_a(doc)
        if agreement_type == "lse_policy_guidelines":
            return parse_lse_policy_guidelines(doc)

    return parse_generic(doc)
