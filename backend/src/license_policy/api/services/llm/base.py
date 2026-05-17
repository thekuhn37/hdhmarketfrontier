"""Abstract LLM provider interface.

Add a new provider by subclassing LLMProvider and implementing `complete`.
Register it in api/dependencies/store.py:get_llm_provider().
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system_prompt: str, user_message: str) -> str:
        """Send a system + user message, return the assistant reply."""
        ...

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """True when the provider has credentials and can be called."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...


class NoopProvider(LLMProvider):
    """Fallback used when no LLM is configured.

    Returns a structured summary of the raw policy data so the API
    remains useful even without an API key.
    """

    async def complete(self, system_prompt: str, user_message: str) -> str:
        return (
            "No LLM provider is configured. "
            "Set LLM_PROVIDER=anthropic and ANTHROPIC_API_KEY in your .env file "
            "to enable natural-language answers. "
            "The structured policy data is available in the citations and "
            "related_sections fields of this response."
        )

    @property
    def is_available(self) -> bool:
        return False

    @property
    def provider_name(self) -> str:
        return "none"
