from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

JobStatus = Literal["queued", "transcribing", "summarizing", "complete", "error"]


class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus


class JobStatusResponse(BaseModel):
    job_id: str
    filename: str
    status: JobStatus
    transcript: str | None = None
    summary: str | None = None
    language_detected: str | None = None
    duration_seconds: float | None = None
    error_message: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
