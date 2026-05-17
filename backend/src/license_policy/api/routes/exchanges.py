from __future__ import annotations

from fastapi import APIRouter

from ..dependencies.store import get_store
from ..schemas.exchanges import ExchangeInfo, ExchangeListResponse
from ..services.document_service import get_document_service

router = APIRouter(tags=["exchanges"])

_EXCHANGE_DISPLAY_NAMES: dict[str, str] = {
    "cme": "CME Group",
    "asx": "ASX (Australian Securities Exchange)",
    "lse": "London Stock Exchange (LSE)",
    "nasdaq": "Nasdaq",
    "ice": "Intercontinental Exchange (ICE)",
    "hkex": "Hong Kong Exchanges and Clearing (HKEX)",
    "sgx": "Singapore Exchange (SGX)",
    "tmx": "TMX Group",
    "cboe": "Cboe Global Markets",
    "nyse": "New York Stock Exchange (NYSE)",
    "eurex": "Eurex",
}


@router.get("/exchanges", response_model=ExchangeListResponse)
def list_exchanges() -> ExchangeListResponse:
    """Return all loaded exchanges with agreement types, product families,
    and document counts. Used by the frontend exchange toggle panel."""
    store = get_store()
    doc_svc = get_document_service()

    raw = store.list_exchanges()
    processed_counts = doc_svc.get_processed_count_by_exchange()

    items: list[ExchangeInfo] = []
    for exchange_lower, info in raw.items():
        code = exchange_lower.upper()
        items.append(ExchangeInfo(
            id=exchange_lower,
            name=_EXCHANGE_DISPLAY_NAMES.get(exchange_lower, code),
            code=code,
            enabled_by_default=True,
            agreement_types=info["agreement_types"],
            product_families=info["product_families"],
            document_count=len(info["agreement_types"]),
            processed_document_count=processed_counts.get(exchange_lower, 0),
        ))

    return ExchangeListResponse(exchanges=items, total=len(items))
