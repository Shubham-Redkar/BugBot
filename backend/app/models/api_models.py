from uuid import UUID

from pydantic import BaseModel, Field

from .finding_models import Finding
from .scan_models import ScanResult, ScanStatus


class HealthResponse(BaseModel):
    message: str


class ScanResultResponse(ScanResult):
    """Public scan representation with temporary legacy compatibility fields."""

    url: str
    health_score: int | None = None
    health_status: str | None = None
    issues: list[Finding] = Field(default_factory=list)


class CreateScanResponse(BaseModel):
    scan_id: UUID
    status: ScanStatus
    poll_url: str
