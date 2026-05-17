from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class DocumentStatus(str, Enum):
    processed = "processed"
    processing = "processing"
    parser_required = "parser_required"
    failed = "failed"
    pending = "pending"


# ---------------------------------------------------------------------------
# Internal storage model — matches registry.json exactly.
# Field names must not change without migrating existing registry files.
# ---------------------------------------------------------------------------

class DocumentRecord(BaseModel):
    """Internal model persisted to data/registry.json."""
    id: str
    filename: str
    exchange: str | None = None
    agreement_type: str | None = None
    upload_date: datetime               # internal field name
    processed_at: datetime | None = None
    status: DocumentStatus
    raw_path: str
    processed_path: str | None = None
    file_size: int | None = None
    error: str | None = None            # internal field name


# ---------------------------------------------------------------------------
# External API response models — frontend-stable contract.
# ---------------------------------------------------------------------------

class DocumentResponse(BaseModel):
    """Frontend-facing document shape returned by all document endpoints."""
    id: str
    filename: str
    exchange: str | None = None
    agreement_type: str | None = None
    document_type: str | None = None    # human-readable alias for agreement_type
    uploaded_at: datetime
    processed_at: datetime | None = None
    status: DocumentStatus
    file_size: int | None = None
    error_message: str | None = None            # populated when status = failed
    parser_required_reason: str | None = None   # populated when status = parser_required

    @classmethod
    def from_record(cls, r: DocumentRecord) -> "DocumentResponse":
        return cls(
            id=r.id,
            filename=r.filename,
            exchange=r.exchange,
            agreement_type=r.agreement_type,
            document_type=_humanize_agreement_type(r.agreement_type),
            uploaded_at=r.upload_date,
            processed_at=r.processed_at,
            status=r.status,
            file_size=r.file_size,
            error_message=r.error if r.status == DocumentStatus.failed else None,
            parser_required_reason=(
                r.error if r.status == DocumentStatus.parser_required else None
            ),
        )


class UploadResponse(BaseModel):
    """Returned immediately after a PDF upload (before preprocessing completes)."""
    document_id: str
    filename: str
    exchange: str | None = None
    agreement_type: str | None = None
    status: DocumentStatus
    message: str
    next_action: str


class DeleteResponse(BaseModel):
    """Returned by DELETE /api/documents/{id}."""
    success: bool
    document_id: str
    message: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_AGREEMENT_TYPE_LABELS: dict[str, str] = {
    "derived_data": "Derived Data License",
    "information": "Information License",
    "product_guide": "Product & Services Guide",
    "fee_schedule": "Fee Schedule",
    "marketsource_agreement": "MarketSource Agreement",
    "redistribution": "Redistribution Agreement",
}


def _humanize_agreement_type(at: str | None) -> str | None:
    if at is None:
        return None
    return _AGREEMENT_TYPE_LABELS.get(at, at.replace("_", " ").title())
