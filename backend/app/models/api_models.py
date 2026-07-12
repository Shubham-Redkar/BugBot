from uuid import UUID

from pydantic import BaseModel

from .finding_models import Finding
from .scan_models import ScanResult


class HealthResponse(BaseModel):
    message: str


class ScanResultResponse(ScanResult):
    """Public scan representation with temporary legacy compatibility fields."""

    url: str
    issues: list[Finding]


class CreateScanResponse(BaseModel):
    scan_id: UUID
    result: ScanResultResponse
