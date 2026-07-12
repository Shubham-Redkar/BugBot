from typing import Any, Literal

from pydantic import BaseModel, Field


Severity = Literal["Critical", "High", "Medium", "Low", "Unknown"]


class FindingEvidence(BaseModel):
    """Machine-collected evidence supporting a finding."""

    selector: str | None = None
    html: str | None = None
    console_message: str | None = None
    resource_url: str | None = None
    http_status: int | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class Finding(BaseModel):
    """A normalized issue produced by a deterministic browser check."""

    rule_id: str
    page: str
    issue_type: str
    severity: Severity
    description: str
    evidence: FindingEvidence = Field(default_factory=FindingEvidence)
    screenshot: str | None = None
    explanation: str | None = None
    impact: str | None = None
    fix_suggestion: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    fingerprint: str | None = None
