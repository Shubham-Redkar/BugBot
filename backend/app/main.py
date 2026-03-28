import asyncio
import sys
from fastapi import FastAPI
from api.routes import router

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI(
    title="BugBot API",
    description="Automated website QA scanner with AI-powered issue explanations.",
    version="1.0.0",
)

app.include_router(router)
