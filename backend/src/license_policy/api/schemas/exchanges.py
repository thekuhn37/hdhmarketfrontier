from __future__ import annotations

from pydantic import BaseModel, computed_field


class ExchangeInfo(BaseModel):
    id: str                          # lowercase exchange code — stable key for frontend
    name: str                        # display name e.g. "CME Group"
    code: str                        # uppercase ticker e.g. "CME"
    enabled_by_default: bool = True
    agreement_types: list[str]
    product_families: list[str]
    document_count: int              # total agreements loaded
    processed_document_count: int    # agreements with a processed JSON


class ExchangeListResponse(BaseModel):
    exchanges: list[ExchangeInfo]
    total: int
