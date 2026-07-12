from datetime import datetime, timezone
from uuid import UUID

from agents.report_agent import enrich_findings
from models.scan_models import ScanContext, ScanError
from services.finding_analysis import analyze_findings
from services.playwright_service import test_website


FAILURE_ISSUE_TYPES = {"Page Load Failure", "Page Scan Failure"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def run_scan(url: str, scan_id: UUID | None = None) -> dict:
    """Coordinate deterministic scanning, analysis, and AI enrichment."""
    context_args = {"scan_id": scan_id} if scan_id is not None else {}
    context = ScanContext(target_url=url, status="running", **context_args)

    try:
        raw_result = await test_website(url)
        pages_scanned = int(raw_result.get("pages_scanned", 0))
        analysis = analyze_findings(raw_result.get("issues", []), pages_scanned)
        try:
            findings = await enrich_findings(analysis.findings)
        except Exception as exc:
            findings = analysis.findings
            context.errors.append(
                ScanError(stage="explanation", message=str(exc))
            )

        failed_pages = {
            page.get("url")
            for page in raw_result.get("pages", [])
            if page.get("status") in {"failed", "timed_out"} and page.get("url")
        }
        if not failed_pages:
            failed_pages = {
                finding.get("page")
                for finding in findings
                if finding.get("issue_type") in FAILURE_ISSUE_TYPES
                and finding.get("page")
            }
        raw_errors = raw_result.get("errors", [])
        context.errors.extend(
            ScanError.model_validate(error)
            for error in raw_errors
            if isinstance(error, dict)
        )
        context.status = (
            "completed_with_errors"
            if failed_pages or context.errors
            else "completed"
        )
        context.completed_at = utc_now()

        result = {
            **raw_result,
            "scan_id": str(context.scan_id),
            "target_url": url,
            "status": context.status,
            "pages_failed": len(failed_pages),
            "issues_found": len(findings),
            "health_score": analysis.health_score,
            "health_status": analysis.health_status,
            "summary": analysis.summary,
            # Keep `issues` until existing API consumers migrate to `findings`.
            "issues": findings,
            "findings": findings,
            "errors": [error.model_dump(mode="json") for error in context.errors],
            "started_at": raw_result.get("scanned_at")
            or context.started_at.isoformat(),
            "completed_at": context.completed_at.isoformat(),
        }
        return result

    except Exception as exc:
        context.status = "failed"
        context.completed_at = utc_now()
        context.errors.append(ScanError(stage="scan", message=str(exc)))
        raise
