from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict


class IssueModel(BaseModel):
    page: str
    issue_type: str
    severity: str
    description: str
    screenshot: Optional[str] = None
    explanation: str = ""
    impact: str = ""
    fix_suggestion: str = ""
    evidence: Dict[str, Any] = Field(default_factory=dict)


class ScanResultModel(BaseModel):
    url: str
    pages_scanned: int
    issues_found: int
    health_score: int
    health_status: str
    summary: Dict[str, int]
    issues: List[IssueModel]
