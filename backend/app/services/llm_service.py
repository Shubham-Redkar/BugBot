import json
from typing import Any

from openai import AsyncOpenAI

from config import get_settings


_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        if settings.xai_api_key is None:
            raise RuntimeError("XAI_API_KEY is not configured")
        _client = AsyncOpenAI(
            api_key=settings.xai_api_key.get_secret_value(),
            base_url=settings.xai_base_url,
            timeout=settings.llm_timeout_seconds,
        )
    return _client


async def generate_json(prompt: str, system: str) -> dict[str, Any]:
    """Request one JSON object and fail clearly when the response is invalid."""
    settings = get_settings()
    response = await get_client().chat.completions.create(
        model=settings.llm_model,
        max_tokens=settings.llm_max_tokens,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )

    if not response.choices or not response.choices[0].message.content:
        raise ValueError("LLM returned no JSON content")

    parsed = json.loads(response.choices[0].message.content)
    if not isinstance(parsed, dict):
        raise ValueError("LLM response must be a JSON object")
    return parsed


async def close_llm_client() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None
