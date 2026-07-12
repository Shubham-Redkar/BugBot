from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.finding_models import Finding


ScanStatus = Literal[
    "pending",
    "running",
    "completed",
    "completed_with_errors",
    "failed",
]
PageStatus = Literal["pending", "scanned", "failed", "timed_out"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ScanError(BaseModel):
    """A stage failure that should remain visible in a partial scan result."""

    stage: str
    message: str
    page: str | None = None
    rule_id: str | None = None


class ScannedPage(BaseModel):
    """The observable result of visiting one discovered page."""

    url: str
    status: PageStatus = "pending"
    source_url: str | None = None
    depth: int = Field(default=0, ge=0)
    title: str | None = None
    http_status: int | None = None
    duration_ms: int | None = Field(default=None, ge=0)
    error: str | None = None


class ScanContext(BaseModel):
    """Mutable orchestration state shared explicitly between scan stages."""

    scan_id: UUID = Field(default_factory=uuid4)
    target_url: str
    status: ScanStatus = "pending"
    pages: list[ScannedPage] = Field(default_factory=list)
    findings: list[Finding] = Field(default_factory=list)
    errors: list[ScanError] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None


class ScanResult(BaseModel):
    """Stable API and persistence contract for a completed or partial scan."""

    scan_id: UUID
    target_url: str
    status: ScanStatus
    health_score: int = Field(ge=0, le=100)
    health_status: str
    summary: dict[str, int] = Field(default_factory=dict)
    pages_scanned: int = Field(ge=0)
    pages_failed: int = Field(default=0, ge=0)
    issues_found: int = Field(ge=0)
    pages: list[ScannedPage] = Field(default_factory=list)
    findings: list[Finding] = Field(default_factory=list)
    errors: list[ScanError] = Field(default_factory=list)
    started_at: datetime
    completed_at: datetime | None = None
    scan_duration_seconds: float | None = Field(default=None, ge=0)
