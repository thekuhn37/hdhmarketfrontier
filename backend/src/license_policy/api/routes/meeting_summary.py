from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from ..config import settings
from ..schemas.meeting_summary import JobCreateResponse
from ..services.meeting_summary_service import MeetingSummaryService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["meeting-summary"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".aac", ".webm", ".ogg"}
MAX_FILE_BYTES = 200 * 1024 * 1024  # 200 MB hard limit before compression


def _get_service() -> MeetingSummaryService:
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured.")
    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(status_code=503, detail="Supabase not configured.")
    return MeetingSummaryService(
        openai_api_key=settings.openai_api_key,
        supabase_url=settings.supabase_url,
        supabase_service_key=settings.supabase_service_key,
    )


@router.post("/meeting-summary/jobs", response_model=JobCreateResponse, status_code=202)
async def create_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: str = Form(...),
) -> JobCreateResponse:
    """Accept an audio upload, enqueue processing, return job_id immediately."""
    suffix = "." + (file.filename or "").rsplit(".", 1)[-1].lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported format '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(file_bytes) // 1_048_576} MB). Maximum is 200 MB.",
        )

    svc = _get_service()
    background_tasks.add_task(svc.process, job_id, file.filename or "recording", file_bytes)
    logger.info("Job %s queued for %s (%.1f MB)", job_id, file.filename, len(file_bytes) / 1e6)
    return JobCreateResponse(job_id=job_id, status="queued")


@router.delete("/meeting-summary/jobs/{job_id}", status_code=204)
async def delete_job(job_id: str) -> None:
    """Delete a job record from Supabase (the actual row deletion is done on the Next.js side)."""
    # Deletion is handled by the Next.js API route with the service key.
    # This endpoint exists for future direct-backend use.
    return None
