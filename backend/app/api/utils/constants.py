import os

MAX_PAGES = int(os.getenv("MAX_PAGES", 5))
HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"
SCREENSHOT_DIR = "screenshots"

LLM_MODEL = os.getenv("LLM_MODEL", "grok-3")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", 1024))
XAI_BASE_URL = "https://api.x.ai/v1"
