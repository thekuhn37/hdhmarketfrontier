"""Singleton accessors for PolicyStore and LLMProvider.

Both objects are initialised once at API startup and shared across requests.
Call refresh_store() after any change to data/processed/ (upload, delete).
"""
from __future__ import annotations

from pathlib import Path

from license_policy.server.data_store import PolicyStore

from ..config import DATA_PROCESSED, settings
from ..services.llm.base import LLMProvider, NoopProvider

# ---------------------------------------------------------------------------
# PolicyStore singleton
# ---------------------------------------------------------------------------

_store: PolicyStore | None = None


def init_store() -> None:
    """Create (or recreate) the PolicyStore from data/processed/."""
    global _store
    data_dir = DATA_PROCESSED if DATA_PROCESSED.exists() else None
    _store = PolicyStore(data_dir)


def get_store() -> PolicyStore:
    if _store is None:
        init_store()
    return _store  # type: ignore[return-value]


def refresh_store() -> None:
    """Reload all processed JSONs — call after upload or delete."""
    init_store()


def load_file_into_store(path: Path) -> None:
    """Incrementally add one JSON file without reloading everything."""
    get_store().load_file(path)


# ---------------------------------------------------------------------------
# LLM provider singleton
# ---------------------------------------------------------------------------

_llm: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    global _llm
    if _llm is None:
        _llm = _build_llm_provider()
    return _llm


def _build_llm_provider() -> LLMProvider:
    provider = settings.llm_provider.lower()
    if provider == "anthropic" and settings.anthropic_api_key:
        try:
            from ..services.llm.anthropic_provider import AnthropicProvider
            return AnthropicProvider(
                api_key=settings.anthropic_api_key,
                model=settings.llm_model,
            )
        except Exception:
            pass
    if provider == "openai" and settings.openai_api_key:
        try:
            from ..services.llm.openai_provider import OpenAIProvider
            model = settings.llm_model if settings.llm_model.startswith("gpt") else "gpt-4o-mini"
            return OpenAIProvider(api_key=settings.openai_api_key, model=model)
        except Exception:
            pass
    return NoopProvider()
