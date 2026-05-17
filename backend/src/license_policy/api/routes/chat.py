from __future__ import annotations

from fastapi import APIRouter

from ..dependencies.store import get_llm_provider, get_store
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.chat_service import ChatService, DocumentLookup
from ..services.document_service import get_document_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """Answer a licensing question using structured policy data.

    - `enabled_exchanges`: restrict search to specific exchanges (e.g. `["CME"]`).
      Empty = all loaded exchanges.
    - Each citation includes `document_id`, `filename`, and `document_title`
      so the frontend can trace the answer back to the source document.
    - Set `ANTHROPIC_API_KEY` in `.env` for natural-language synthesis.
      Without it the endpoint returns structured policy data directly.
    """
    # Build document lookup map so ChatService can enrich citations
    doc_svc = get_document_service()
    store = get_store()

    # (exchange.lower(), agreement_type) → (doc_id, filename, agreement_title)
    doc_lookup: DocumentLookup = {}
    doc_map = doc_svc.get_doc_by_exchange_type()
    for (ex_lower, at), rec in doc_map.items():
        # Get agreement_title from the loaded policy
        policies = store.get_policy(ex_lower, at)
        doc_title = policies[0].agreement_title if policies else None
        doc_lookup[(ex_lower, at)] = (rec.id, rec.filename, doc_title)

    svc = ChatService(store=store, llm=get_llm_provider(), doc_lookup=doc_lookup)
    return await svc.answer(req)
