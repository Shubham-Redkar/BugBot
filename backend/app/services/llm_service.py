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
    """Send a prompt to Grok and return the text response safely."""
    messages = []

    if system:
        messages.append({"role": "system", "content": system})

    messages.append({"role": "user", "content": prompt})

    try:
        response = await _client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=LLM_MAX_TOKENS,
            messages=messages,
        )

        # Debug log (IMPORTANT)
        print("[llm_service] RAW RESPONSE:", response)

        if not response.choices:
            return ""

        message = response.choices[0].message

        if not message:
            return ""

        content = getattr(message, "content", None)

        if not content:
            return ""

        return content.strip()

    except Exception as e:
        print(f"[llm_service] LLM call failed: {e}")
        return ""
