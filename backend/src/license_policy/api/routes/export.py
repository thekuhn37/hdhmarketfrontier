from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from ..schemas.chat import DISCLAIMER
from ..schemas.export import ExportRequest, ExportResponse

router = APIRouter(tags=["export"])


@router.post("/export", response_model=ExportResponse)
async def export_session(req: ExportRequest) -> ExportResponse:
    """Export a Q&A session as Markdown or JSON.

    The response body contains the export `content` inline.
    Frontend usage:
    ```js
    const blob = new Blob([response.content], { type: response.content_type });
    const url = URL.createObjectURL(blob);
    // trigger download with response.filename
    ```
    """
    now = datetime.now(timezone.utc)
    timestamp = now.strftime("%Y%m%d-%H%M%S")
    export_id = str(uuid.uuid4())

    if req.format == "json":
        payload = {
            "export_id": export_id,
            "exported_at": now.isoformat(),
            "exchanges": req.exchanges,
            "question": req.question,
            "answer": req.answer,
            "citations": [c.model_dump() for c in req.citations],
            "disclaimer": DISCLAIMER,
        }
        content = json.dumps(payload, indent=2, default=str)
        filename = f"license-policy-export-{timestamp}.json"
        content_type = "application/json"
    else:
        citation_lines = "\n".join(
            "- **{exchange}** – {atype}{sec}{title}{excerpt}".format(
                exchange=c.exchange,
                atype=c.agreement_type,
                sec=f", Section {c.section}" if c.section else "",
                title=f": *{c.title}*" if c.title else "",
                excerpt=f"\n  > {c.excerpt}" if c.excerpt else "",
            )
            for c in req.citations
        ) or "_No citations._"

        content = f"""# Data License Benchmark Platform — Export

**Export ID:** {export_id}
**Exported:** {now.strftime('%Y-%m-%d %H:%M:%S')} UTC
**Exchanges:** {', '.join(req.exchanges) if req.exchanges else 'all'}

---

## Question

{req.question}

---

## Answer

{req.answer}

---

## Citations

{citation_lines}

---

## Disclaimer

_{DISCLAIMER}_
"""
        filename = f"license-policy-export-{timestamp}.md"
        content_type = "text/markdown"

    return ExportResponse(
        export_id=export_id,
        format=req.format,
        filename=filename,
        content=content,
        content_type=content_type,
        created_at=now.isoformat(),
        message=f"Export ready. Suggested filename: {filename}",
    )
