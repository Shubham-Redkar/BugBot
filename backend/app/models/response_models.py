from typing import List, Optional, Literal
from pydantic import BaseModel, Field

SeverityType = Literal["Low", "Medium", "High"]


class IssueModel(BaseModel):
    page: str = Field(..., description="Page URL where issue was found")
    issue_type: str = Field(..., description="Type of issue detected")
    severity: SeverityType = Field(..., description="Severity of the issue")
    description: str = Field(..., description="Short issue description")
    screenshot: Optional[str] = Field(default=None, description="Path to screenshot")
    explanation: Optional[str] = Field(default="", description="AI explanation")
    impact: Optional[str] = Field(default="", description="Impact of the issue")
    fix_suggestion: Optional[str] = Field(default="", description="Suggested fix")


class ScanResultModel(BaseModel):
    url: str
    pages_scanned: int
    issues_found: int
    issues: List[IssueModel]
