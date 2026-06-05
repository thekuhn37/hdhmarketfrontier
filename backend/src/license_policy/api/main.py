"""FastAPI application for the Data License Benchmark Platform backend.

MCP server (uv run serve) remains independent and fully functional.
This module adds a REST API layer on top of the same PolicyStore and
preprocessing pipeline. Deploy trigger: SUPABASE_URL fix 2026-06-05.

Usage:
    uv run api                   # start API server (default port 8000)
    uv run mcp dev ...           # start MCP server (unchanged)
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .dependencies.store import init_store
from .routes import chat, documents, exchanges, export, meeting_summary
from .services.document_service import get_document_service
from .services.gcs_storage import init_gcs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    logger.info("Initialising GCS storage…")
    init_gcs(settings.gcs_bucket_name)

    logger.info("Initialising PolicyStore…")
    init_store()

    logger.info("Reconciling document registry…")
    doc_svc = get_document_service()
    doc_svc.reconcile()

    logger.info("API ready. Docs at http://localhost:%s/docs", settings.api_port)
    yield
    # ── Shutdown (nothing to clean up) ───────────────────────────


app = FastAPI(
    title="Data License Benchmark Platform — Backend API",
    description=(
        "REST API for querying financial exchange data license policies. "
        "Powers the HDHMarketFrontier Pioneer Lab section.\n\n"
        "**MCP server** is also available: `uv run serve` (unchanged)."
    ),
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exchanges.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(meeting_summary.router, prefix="/api")


@app.get("/health", tags=["system"])
def health() -> dict:
    """Liveness check."""
    return {"status": "ok", "service": "license-policy-api", "version": "0.2.0"}


def run() -> None:
    """Entry point for `uv run api`."""
    uvicorn.run(
        "license_policy.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )
