from pydantic import BaseModel, HttpUrl, Field

class ScanRequest(BaseModel):
    url: HttpUrl = Field(..., description="Website URL to scan")
