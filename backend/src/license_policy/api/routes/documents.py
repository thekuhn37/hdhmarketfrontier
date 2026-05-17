from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..schemas.documents import (
    DeleteResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentStatus,
    UploadResponse,
)
from ..services.document_service import get_document_service

router = APIRouter(tags=["documents"])


@router.get("/documents", response_model=DocumentListResponse)
def list_documents() -> DocumentListResponse:
    """List all tracked documents with processing status."""
    svc = get_document_service()
    docs = [DocumentResponse.from_record(r) for r in svc.list_documents()]
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str) -> DocumentResponse:
    """Get a single document record by ID."""
    svc = get_document_service()
    rec = svc.get_document(doc_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Document {doc_id!r} not found.")
    return DocumentResponse.from_record(rec)


@router.post("/documents/upload", response_model=UploadResponse, status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> UploadResponse:
    """Upload a PDF for indexing.

    - Returns **202 Accepted** immediately with `status: pending`.
    - Preprocessing runs in the background.
    - Poll `GET /api/documents/{id}` until `status` becomes:
      - `processed` — ready to query
      - `parser_required` — needs a custom parser (see `parser_required_reason`)
      - `failed` — unexpected error (see `error_message`)
    """
    svc = get_document_service()
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    try:
        content = await file.read()
        rec = await svc.save_upload(file.filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    background_tasks.add_task(svc.process_document, rec.id)

    return UploadResponse(
        document_id=rec.id,
        filename=rec.filename,
        exchange=rec.exchange,
        agreement_type=rec.agreement_type,
        status=rec.status,
        message="PDF received. Preprocessing started in background.",
        next_action=f"Poll GET /api/documents/{rec.id} until status = processed",
    )


@router.get("/documents/{doc_id}/pdf")
def get_document_pdf(doc_id: str) -> FileResponse:
    """Stream the raw PDF for a document. Used by the frontend citation viewer."""
    from ..config import PROJECT_ROOT

    svc = get_document_service()
    rec = svc.get_document(doc_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Document {doc_id!r} not found.")
    if not rec.raw_path:
        raise HTTPException(status_code=404, detail="No PDF available for this document.")
    pdf_path = PROJECT_ROOT / rec.raw_path
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

    # RFC 6266: ASCII fallback + UTF-8 encoded filename* for non-ASCII filenames
    ascii_name = rec.filename.encode("ascii", "replace").decode("ascii").replace("?", "_")
    encoded_name = quote(rec.filename)
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded_name}'
            )
        },
    )


@router.delete("/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str) -> DeleteResponse:
    """Delete a document — removes PDF, processed JSON, and registry entry.
    Deleted documents are no longer used in /api/chat queries.
    """
    svc = get_document_service()
    try:
        await svc.delete_document(doc_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return DeleteResponse(
        success=True,
        document_id=doc_id,
        message="Document and all associated files removed successfully.",
    )
