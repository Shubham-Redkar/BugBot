import sys
import asyncio
import os

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes import router
from utils.constants import SCREENSHOT_DIR

app = FastAPI(
    title="BugBot API",
    description="Automated website QA scanner with AI-powered issue explanations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SCREENSHOT_DIR is an absolute path anchored to constants.py's location
# (backend/app/utils/../screenshots = backend/app/screenshots).
# Using it directly here guarantees FastAPI serves from the same folder
# Playwright writes to, regardless of where uvicorn is launched from.
print(f"[main] Serving screenshots from: {SCREENSHOT_DIR}")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
app.mount("/screenshots", StaticFiles(directory=SCREENSHOT_DIR), name="screenshots")

app.include_router(router)