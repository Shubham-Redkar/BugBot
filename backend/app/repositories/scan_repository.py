import re
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.tables import (
    Finding,
    PageStatus,
    Scan,
    ScanError,
    ScanPage,
    ScanStatus,
    Severity,
)
from services.finding_analysis import finding_fingerprint


def parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None


def normalize_rule_id(finding: dict[str, Any]) -> str:
    existing = str(finding.get("rule_id") or "").strip()
    if existing:
        return existing
    issue_type = str(finding.get("issue_type") or "unknown")
    normalized = re.sub(r"[^a-z0-9]+", ".", issue_type.lower()).strip(".")
    return normalized or "unknown"


def build_scan_record(result: dict[str, Any]) -> Scan:
    scan_id = UUID(str(result["scan_id"]))
    page_records = [
        ScanPage(
            url=str(page["url"]),
            source_url=page.get("source_url"),
            depth=int(page.get("depth", 0)),
            status=PageStatus(str(page.get("status", "scanned")).lower()),
            title=page.get("title"),
            http_status=page.get("http_status"),
            duration_ms=page.get("duration_ms"),
            error=page.get("error"),
        )
        for page in result.get("pages", [])
        if isinstance(page, dict) and page.get("url")
    ]
    pages_by_url = {page.url: page for page in page_records}

    finding_records = []
    for finding in result.get("findings", result.get("issues", [])):
        if not isinstance(finding, dict):
            continue
        evidence = finding.get("evidence")
        if not isinstance(evidence, dict):
            evidence = {}
        severity_value = str(finding.get("severity", "unknown")).lower()
        if severity_value not in {item.value for item in Severity}:
            severity_value = Severity.UNKNOWN.value

        finding_records.append(
            Finding(
                page=pages_by_url.get(str(finding.get("page", ""))),
                rule_id=normalize_rule_id(finding),
                issue_type=str(finding.get("issue_type", "Unknown issue")),
                severity=Severity(severity_value),
                description=str(finding.get("description", "")),
                selector=evidence.get("selector"),
                evidence=evidence,
                screenshot_path=finding.get("screenshot"),
                explanation=finding.get("explanation"),
                impact=finding.get("impact"),
                fix_suggestion=finding.get("fix_suggestion"),
                confidence=finding.get("confidence"),
                fingerprint=str(
                    finding.get("fingerprint") or finding_fingerprint(finding)
                ),
            )
        )

    error_records = [
        ScanError(
            stage=str(error.get("stage", "scan")),
            page_url=error.get("page"),
            rule_id=error.get("rule_id"),
            message=str(error.get("message", "Unknown scan error")),
        )
        for error in result.get("errors", [])
        if isinstance(error, dict)
    ]

    return Scan(
        id=scan_id,
        target_url=str(result.get("target_url") or result.get("url") or ""),
        status=ScanStatus(str(result.get("status", "completed")).lower()),
        health_score=result.get("health_score"),
        health_status=result.get("health_status"),
        pages_discovered=len(page_records),
        pages_scanned=int(result.get("pages_scanned", len(page_records))),
        pages_failed=int(result.get("pages_failed", 0)),
        issues_found=int(result.get("issues_found", len(finding_records))),
        summary=result.get("summary", {}),
        started_at=parse_datetime(result.get("started_at") or result.get("scanned_at")),
        completed_at=parse_datetime(result.get("completed_at")),
        duration_seconds=result.get("scan_duration_seconds"),
        pages=page_records,
        findings=finding_records,
        errors=error_records,
    )


def scan_to_dict(scan: Scan) -> dict[str, Any]:
    pages = [
        {
            "url": page.url,
            "source_url": page.source_url,
            "depth": page.depth,
            "status": page.status.value,
            "title": page.title,
            "http_status": page.http_status,
            "duration_ms": page.duration_ms,
            "error": page.error,
        }
        for page in scan.pages
    ]
    findings = [
        {
            "rule_id": finding.rule_id,
            "page": finding.page.url if finding.page else scan.target_url,
            "issue_type": finding.issue_type,
            "severity": finding.severity.value.title(),
            "description": finding.description,
            "evidence": finding.evidence,
            "screenshot": finding.screenshot_path,
            "explanation": finding.explanation,
            "impact": finding.impact,
            "fix_suggestion": finding.fix_suggestion,
            "confidence": finding.confidence,
            "fingerprint": finding.fingerprint,
        }
        for finding in scan.findings
    ]
    errors = [
        {
            "stage": error.stage,
            "page": error.page_url,
            "rule_id": error.rule_id,
            "message": error.message,
        }
        for error in scan.errors
    ]

    return {
        "scan_id": str(scan.id),
        "url": scan.target_url,
        "target_url": scan.target_url,
        "status": scan.status.value,
        "health_score": scan.health_score,
        "health_status": scan.health_status,
        "summary": scan.summary,
        "pages_scanned": scan.pages_scanned,
        "pages_failed": scan.pages_failed,
        "issues_found": scan.issues_found,
        "pages": pages,
        "issues": findings,
        "findings": findings,
        "errors": errors,
        "started_at": scan.started_at.isoformat() if scan.started_at else None,
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        "scan_duration_seconds": scan.duration_seconds,
    }


class ScanRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, result: dict[str, Any]) -> UUID:
        scan = build_scan_record(result)
        async with self.session.begin():
            self.session.add(scan)
        return scan.id

    async def get(self, scan_id: UUID) -> dict[str, Any] | None:
        statement = (
            select(Scan)
            .where(Scan.id == scan_id)
            .options(
                selectinload(Scan.pages),
                selectinload(Scan.findings).selectinload(Finding.page),
                selectinload(Scan.errors),
            )
        )
        scan = await self.session.scalar(statement)
        return scan_to_dict(scan) if scan else None
