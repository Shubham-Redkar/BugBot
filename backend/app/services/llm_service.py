import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from utils.constants import LLM_MODEL, LLM_MAX_TOKENS, XAI_BASE_URL

load_dotenv()

_client = AsyncOpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url=XAI_BASE_URL,
)


async def call_llm(prompt: str, system: str = "") -> str:
    """Send a prompt to Grok and return the text response."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await _client.chat.completions.create(
        model=LLM_MODEL,
        max_tokens=LLM_MAX_TOKENS,
        messages=messages,
    )

    return response.choices[0].message.content.strip()
