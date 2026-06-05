"""Optional GCS-backed persistence for DLB document storage.

If GCS_BUCKET_NAME is not set the module degrades gracefully to a no-op,
so local development works without any GCP credentials.
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class GCSStorage:
    """Thin wrapper around google-cloud-storage for DLB document persistence."""

    RAW_PREFIX = "raw"
    PROCESSED_PREFIX = "processed"

    def __init__(self, bucket_name: str) -> None:
        from google.cloud import storage as gcs  # lazy import — not installed locally
        self._client = gcs.Client()
        self._bucket = self._client.bucket(bucket_name)
        self._bucket_name = bucket_name
        logger.info("GCS storage initialised — bucket: %s", bucket_name)

    # ── Upload ─────────────────────────────────────────────────────────────────

    def upload_raw(self, local_path: Path) -> None:
        blob = self._bucket.blob(f"{self.RAW_PREFIX}/{local_path.name}")
        blob.upload_from_filename(str(local_path))
        logger.info("GCS ↑ raw/%s", local_path.name)

    def upload_processed(self, local_path: Path) -> None:
        blob = self._bucket.blob(f"{self.PROCESSED_PREFIX}/{local_path.name}")
        blob.upload_from_filename(str(local_path))
        logger.info("GCS ↑ processed/%s", local_path.name)

    # ── Download ───────────────────────────────────────────────────────────────

    def sync_to_local(self, raw_dir: Path, processed_dir: Path) -> int:
        """Download any GCS files that are missing locally. Returns count downloaded."""
        count = 0
        for prefix, local_dir in [
            (self.RAW_PREFIX, raw_dir),
            (self.PROCESSED_PREFIX, processed_dir),
        ]:
            local_dir.mkdir(parents=True, exist_ok=True)
            for blob in self._client.list_blobs(self._bucket_name, prefix=f"{prefix}/"):
                filename = Path(blob.name).name
                if not filename:
                    continue
                local_path = local_dir / filename
                if not local_path.exists():
                    blob.download_to_filename(str(local_path))
                    logger.info("GCS ↓ %s/%s", prefix, filename)
                    count += 1
        return count

    # ── Delete ─────────────────────────────────────────────────────────────────

    def delete_raw(self, filename: str) -> None:
        self._delete(f"{self.RAW_PREFIX}/{filename}")

    def delete_processed(self, filename: str) -> None:
        self._delete(f"{self.PROCESSED_PREFIX}/{filename}")

    def _delete(self, blob_name: str) -> None:
        blob = self._bucket.blob(blob_name)
        if blob.exists():
            blob.delete()
            logger.info("GCS ✕ %s", blob_name)


# ── Module-level singleton (None if not configured) ────────────────────────────

_gcs: GCSStorage | None = None


def get_gcs() -> GCSStorage | None:
    return _gcs


def init_gcs(bucket_name: str | None) -> None:
    global _gcs
    if not bucket_name:
        logger.info("GCS_BUCKET_NAME not set — document uploads will not persist across restarts.")
        return
    try:
        _gcs = GCSStorage(bucket_name)
    except Exception as exc:
        logger.warning("GCS init failed (%s) — falling back to local storage only.", exc)
