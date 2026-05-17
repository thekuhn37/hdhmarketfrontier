"""Centralised settings for the REST API layer."""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent

# Filesystem constants — not overridable via env, derived from install location
DATA_RAW = _PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = _PROJECT_ROOT / "data" / "processed"
REGISTRY_PATH = _PROJECT_ROOT / "data" / "registry.json"
PROJECT_ROOT = _PROJECT_ROOT


class Settings(BaseSettings):
    # LLM provider selection
    llm_provider: str = "anthropic"
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    llm_model: str = "claude-sonnet-4-6"

    # Server bind
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # CORS — comma-separated list of allowed origins
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
