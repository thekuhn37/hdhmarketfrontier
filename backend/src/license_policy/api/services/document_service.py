"""Document registry and lifecycle management.

Responsibilities:
- Track every PDF in data/raw/ and its processing status
- Persist metadata to data/registry.json
- Run preprocessing in a thread pool (CPU-bound)
- Keep PolicyStore in sync after upload/delete
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from ..config import DATA_PROCESSED, DATA_RAW, PROJECT_ROOT, REGISTRY_PATH
from ..dependencies.store import load_file_into_store, refresh_store
from ..schemas.documents import DocumentRecord, DocumentStatus
from .gcs_storage import get_gcs

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Filename heuristics — maps known PDF patterns to (exchange, agreement_type)
# ---------------------------------------------------------------------------
_KNOWN_PATTERNS: list[tuple[tuple[str, ...], str, str]] = [
    (("cme", "derived"), "CME", "derived_data"),
    (("cme", "information"), "CME", "information"),
    (("asx", "marketsource"), "ASX", "marketsource_agreement"),
    (("asx", "product"), "ASX", "product_guide"),
    (("asx", "guide"), "ASX", "product_guide"),
    (("asx", "fee"), "ASX", "fee_schedule"),
    (("lse", "schedule a"), "LSE", "fee_schedule"),
    (("lse", "schedule b"), "LSE", "market_data_policy"),
    (("lse", "policy guidelines"), "LSE", "policy_guidelines"),
    (("lse", "terms and conditions"), "LSE", "terms_and_conditions"),
]

_EXCHANGE_TOKENS = ["CME", "ASX", "LSE", "NASDAQ", "ICE", "HKEX", "SGX", "TMX", "CBOE", "NYSE", "EUREX"]


def _detect_from_filename(filename: str) -> tuple[str | None, str | None]:
    f = filename.lower()
    for tokens, exchange, atype in _KNOWN_PATTERNS:
        if all(t in f for t in tokens):
            return exchange, atype
    for ex in _EXCHANGE_TOKENS:
        if ex.lower() in f:
            return ex, None
    return None, None


# ---------------------------------------------------------------------------
# DocumentService
# ---------------------------------------------------------------------------

class DocumentService:
    """In-memory document registry backed by data/registry.json."""

    def __init__(self) -> None:
        self._registry: dict[str, DocumentRecord] = {}
        self._lock = asyncio.Lock()
        self._load_registry()

    # ------------------------------------------------------------------
    # Startup
    # ------------------------------------------------------------------

    def _load_registry(self) -> None:
        if REGISTRY_PATH.exists():
            try:
                raw = json.loads(REGISTRY_PATH.read_text())
                for item in raw.get("documents", []):
                    rec = DocumentRecord.model_validate(item)
                    self._registry[rec.id] = rec
            except Exception as exc:
                logger.warning("Failed to load registry: %s — starting fresh", exc)

    def reconcile(self) -> None:
        """Sync the registry with data/raw/ and data/processed/."""
        DATA_RAW.mkdir(parents=True, exist_ok=True)
        DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

        # Pull any files uploaded via the web UI that live in GCS but not in the image
        gcs = get_gcs()
        if gcs:
            n = gcs.sync_to_local(DATA_RAW, DATA_PROCESSED)
            if n:
                logger.info("GCS sync: downloaded %d file(s) to local data/", n)

        processed_index = self._scan_processed()
        raw_pdfs = sorted(DATA_RAW.glob("*.pdf"))
        existing_filenames = {p.name for p in raw_pdfs}

        by_filename = {r.filename: r for r in self._registry.values()}
        for pdf in raw_pdfs:
            if pdf.name not in by_filename:
                rec = self._make_record(pdf, processed_index)
                self._registry[rec.id] = rec
                logger.info("Discovered PDF: %s (%s)", pdf.name, rec.status)
            else:
                rec = by_filename[pdf.name]
                self._refresh_processed_status(rec, processed_index)

        # Pre-loaded docs (raw_path == "") have no PDF on disk — keep them.
        stale = [
            rid for rid, r in self._registry.items()
            if r.filename not in existing_filenames and r.raw_path
        ]
        for rid in stale:
            logger.info("Removing stale registry entry: %s", self._registry[rid].filename)
            del self._registry[rid]

        self._save_registry()

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def list_documents(self) -> list[DocumentRecord]:
        return sorted(self._registry.values(), key=lambda r: r.upload_date, reverse=True)

    def get_document(self, doc_id: str) -> DocumentRecord | None:
        return self._registry.get(doc_id)

    def get_doc_by_exchange_type(self) -> dict[tuple[str, str], DocumentRecord]:
        """Return {(exchange.lower(), agreement_type): DocumentRecord}."""
        result: dict[tuple[str, str], DocumentRecord] = {}
        for rec in self._registry.values():
            if rec.exchange and rec.agreement_type:
                result[(rec.exchange.lower(), rec.agreement_type)] = rec
        return result

    def get_processed_count_by_exchange(self) -> dict[str, int]:
        """Return {exchange.lower(): count_of_processed_docs}."""
        counts: dict[str, int] = {}
        for rec in self._registry.values():
            if rec.exchange and rec.status == DocumentStatus.processed:
                key = rec.exchange.lower()
                counts[key] = counts.get(key, 0) + 1
        return counts

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def save_upload(self, filename: str, content: bytes) -> DocumentRecord:
        """Persist the uploaded PDF and create/update a registry entry.

        If a document with the same filename already exists, the old entry is
        replaced so the registry never contains duplicate filenames.
        """
        if not filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF files are accepted.")

        safe_name = Path(filename).name
        dest = DATA_RAW / safe_name
        await asyncio.to_thread(dest.write_bytes, content)

        # Persist raw PDF to GCS immediately so it survives container restarts
        gcs = get_gcs()
        if gcs:
            await asyncio.to_thread(gcs.upload_raw, dest)

        exchange, agreement_type = _detect_from_filename(safe_name)

        async with self._lock:
            # Remove any existing entry for this filename to avoid duplicates
            existing_ids = [
                rid for rid, r in self._registry.items() if r.filename == safe_name
            ]
            for rid in existing_ids:
                logger.info("Replacing existing registry entry for %s", safe_name)
                del self._registry[rid]

            rec = DocumentRecord(
                id=str(uuid.uuid4()),
                filename=safe_name,
                exchange=exchange,
                agreement_type=agreement_type,
                upload_date=datetime.now(timezone.utc),
                status=DocumentStatus.pending,
                raw_path=str(dest.relative_to(PROJECT_ROOT)),
                file_size=len(content),
            )
            self._registry[rec.id] = rec
            self._save_registry()

        return rec

    # ------------------------------------------------------------------
    # Preprocessing
    # ------------------------------------------------------------------

    async def process_document(self, doc_id: str) -> None:
        """Run the preprocessing pipeline for a document (async, thread pool)."""
        async with self._lock:
            rec = self._registry.get(doc_id)
            if rec is None:
                return
            rec.status = DocumentStatus.processing
            self._save_registry()

        pdf_path = PROJECT_ROOT / rec.raw_path
        try:
            policy = await asyncio.to_thread(self._run_preprocessing, str(pdf_path))

            json_name = _safe_json_name(rec.filename)
            json_path = DATA_PROCESSED / json_name
            await asyncio.to_thread(json_path.write_text, policy.model_dump_json(indent=2))

            async with self._lock:
                rec.exchange = policy.exchange
                rec.agreement_type = policy.agreement_type.value
                rec.processed_path = str(json_path.relative_to(PROJECT_ROOT))
                rec.processed_at = datetime.now(timezone.utc)
                rec.status = DocumentStatus.processed
                rec.error = None
                self._save_registry()

            # Persist processed JSON to GCS so it loads on next container start
            gcs = get_gcs()
            if gcs:
                await asyncio.to_thread(gcs.upload_processed, json_path)

            load_file_into_store(json_path)
            logger.info("Processed %s → %s", rec.filename, json_name)

        except ValueError as exc:
            async with self._lock:
                rec.status = DocumentStatus.parser_required
                rec.error = str(exc)
                self._save_registry()
            logger.warning("No parser for %s: %s", rec.filename, exc)

        except Exception as exc:
            async with self._lock:
                rec.status = DocumentStatus.failed
                rec.error = str(exc)
                self._save_registry()
            logger.error("Preprocessing failed for %s: %s", rec.filename, exc)

    @staticmethod
    def _run_preprocessing(pdf_path: str):
        from license_policy.preprocessing.normalize import normalize
        from license_policy.preprocessing.pdf_extract import extract_document
        doc = extract_document(pdf_path)
        return normalize(doc)

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_document(self, doc_id: str) -> None:
        """Remove PDF, processed JSON, registry entry, and GCS copies."""
        async with self._lock:
            rec = self._registry.get(doc_id)
            if rec is None:
                raise KeyError(f"Document {doc_id!r} not found.")

            raw_path = PROJECT_ROOT / rec.raw_path
            if raw_path.exists():
                raw_path.unlink()

            if rec.processed_path:
                proc_path = PROJECT_ROOT / rec.processed_path
                if proc_path.exists():
                    proc_path.unlink()

            del self._registry[doc_id]
            self._save_registry()

        # Remove from GCS too
        gcs = get_gcs()
        if gcs:
            await asyncio.to_thread(gcs.delete_raw, rec.filename)
            if rec.processed_path:
                await asyncio.to_thread(gcs.delete_processed, Path(rec.processed_path).name)

        refresh_store()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _scan_processed(self) -> dict[tuple[str, str], Path]:
        index: dict[tuple[str, str], Path] = {}
        for json_path in DATA_PROCESSED.glob("*.json"):
            try:
                raw = json.loads(json_path.read_text())
                key = (raw["exchange"].lower(), raw["agreement_type"])
                index[key] = json_path
            except Exception:
                pass
        return index

    def _make_record(self, pdf: Path, processed: dict[tuple, Path]) -> DocumentRecord:
        exchange, agreement_type = _detect_from_filename(pdf.name)
        processed_path: str | None = None
        status = DocumentStatus.pending

        if exchange and agreement_type:
            key = (exchange.lower(), agreement_type)
            if key in processed:
                processed_path = str(processed[key].relative_to(PROJECT_ROOT))
                status = DocumentStatus.processed

        return DocumentRecord(
            id=str(uuid.uuid4()),
            filename=pdf.name,
            exchange=exchange,
            agreement_type=agreement_type,
            upload_date=datetime.now(timezone.utc),
            status=status,
            raw_path=str(pdf.relative_to(PROJECT_ROOT)),
            processed_path=processed_path,
            file_size=pdf.stat().st_size,
        )

    def _refresh_processed_status(
        self, rec: DocumentRecord, processed: dict[tuple, Path]
    ) -> None:
        if not (rec.exchange and rec.agreement_type):
            return
        key = (rec.exchange.lower(), rec.agreement_type)
        if key in processed:
            rec.processed_path = str(processed[key].relative_to(PROJECT_ROOT))
            if rec.status not in (DocumentStatus.processing, DocumentStatus.processed):
                rec.status = DocumentStatus.processed
        elif rec.status == DocumentStatus.processed:
            rec.processed_path = None
            rec.status = DocumentStatus.pending

    def _save_registry(self) -> None:
        REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
        data = {"documents": [r.model_dump(mode="json") for r in self._registry.values()]}
        REGISTRY_PATH.write_text(json.dumps(data, indent=2, default=str))


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_doc_service: DocumentService | None = None


def get_document_service() -> DocumentService:
    global _doc_service
    if _doc_service is None:
        _doc_service = DocumentService()
    return _doc_service


def _safe_json_name(pdf_filename: str) -> str:
    stem = Path(pdf_filename).stem
    return stem.lower().replace(" ", "-").replace("_", "-") + ".json"
