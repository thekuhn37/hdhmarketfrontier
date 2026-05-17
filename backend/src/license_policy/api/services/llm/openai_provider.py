"""OpenAI LLM provider."""
from __future__ import annotations

from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        try:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=api_key)
        except ImportError as exc:
            raise RuntimeError(
                "The 'openai' package is required. Run: uv add openai"
            ) from exc
        self._model = model
        self._api_key = api_key

    async def complete(self, system_prompt: str, user_message: str) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=2048,
        )
        return response.choices[0].message.content or ""

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    @property
    def provider_name(self) -> str:
        return f"openai/{self._model}"
