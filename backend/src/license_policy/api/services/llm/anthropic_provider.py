"""Claude (Anthropic) LLM provider."""
from __future__ import annotations

from .base import LLMProvider


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6") -> None:
        try:
            from anthropic import AsyncAnthropic
            self._client = AsyncAnthropic(api_key=api_key)
        except ImportError as exc:
            raise RuntimeError(
                "The 'anthropic' package is required. Run: uv add anthropic"
            ) from exc
        self._model = model
        self._api_key = api_key

    async def complete(self, system_prompt: str, user_message: str) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text  # type: ignore[index]

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    @property
    def provider_name(self) -> str:
        return f"anthropic/{self._model}"
