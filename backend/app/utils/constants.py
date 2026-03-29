import os

MAX_PAGES = int(os.getenv("MAX_PAGES", 5))
HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"

# FIX: anchored to this file's directory so it always resolves to
# <project_root>/screenshots regardless of where uvicorn is launched from.
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "screenshots")
SCREENSHOT_DIR = os.path.normpath(SCREENSHOT_DIR)

# ↑ This resolves to: backend/app/screenshots/
# FastAPI mounts this same path in main.py — files and server now point to the same folder.

LLM_MODEL = os.getenv("LLM_MODEL", "grok-3")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", 1024))
XAI_BASE_URL = "https://api.x.ai/v1"