import asyncio
import sys
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from api.routes import router
from config import get_settings
from db.database import close_database
from db.postgres import close_postgres
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from services.llm_service import close_llm_client


settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.screenshot_dir.mkdir(parents=True, exist_ok=True)
    yield
    close_database()
    await close_postgres()
    await close_llm_client()


app = FastAPI(
    title=settings.app_name,
    description="Automated website QA scanner with AI-powered issue explanations.",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.mount(
    "/screenshots",
    StaticFiles(directory=settings.screenshot_dir, check_dir=False),
    name="screenshots",
)
app.include_router(router)
