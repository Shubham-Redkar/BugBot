from pydantic import BaseModel, Field
from typing import Any, Optional, Dict


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
