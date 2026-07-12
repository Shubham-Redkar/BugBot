from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="BugBot API", min_length=1)
    app_version: str = Field(default="1.0.0", min_length=1)
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    database_url: str = "postgresql+asyncpg://bugbot:bugbot@localhost:5432/bugbot"
    database_pool_size: int = Field(default=5, gt=0)
    database_max_overflow: int = Field(default=10, ge=0)
    database_echo: bool = False

    xai_api_key: SecretStr | None = None
    xai_base_url: str = "https://api.x.ai/v1"
    llm_model: str = Field(default="grok-3", min_length=1)
    llm_max_tokens: int = Field(default=1024, gt=0)
    llm_concurrency: int = Field(default=3, gt=0)
    llm_timeout_seconds: float = Field(default=30, gt=0)

    max_pages: int = Field(default=5, gt=0, le=100)
    headless: bool = True
    scan_timeout_seconds: float = Field(default=120, gt=0)
    screenshot_dir: Path = BACKEND_DIR / "app" / "screenshots"

    @field_validator("cors_origins")
    @classmethod
    def reject_wildcard_cors(cls, origins: list[str]) -> list[str]:
        if "*" in origins:
            raise ValueError("CORS_ORIGINS must list explicit trusted origins")
        return origins

    @field_validator("screenshot_dir")
    @classmethod
    def resolve_screenshot_dir(cls, directory: Path) -> Path:
        if directory.is_absolute():
            return directory
        return (BACKEND_DIR / directory).resolve()

    @field_validator("database_url")
    @classmethod
    def require_async_postgres_driver(cls, url: str) -> str:
        if not url.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL must use postgresql+asyncpg://")
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
