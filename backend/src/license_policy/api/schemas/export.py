from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from .chat import Citation


class ExportRequest(BaseModel):
    question: str
    answer: str
    citations: list[Citation] = []
    exchanges: list[str] = []
    format: Literal["markdown", "json"] = "markdown"


class ExportResponse(BaseModel):
    """JSON-body export response.

    The frontend should read `content` and `filename`, then create a Blob
    and trigger a download via URL.createObjectURL().
    """
    export_id: str
    format: str
    filename: str
    content: str
    content_type: str
    created_at: str
    message: str
