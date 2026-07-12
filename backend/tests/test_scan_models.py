from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from models import Finding, ScanContext, ScanError, ScanResult, ScannedPage


def test_scan_context_defaults_are_independent():
    first = ScanContext(target_url="https://example.com")
    second = ScanContext(target_url="https://example.org")

    first.errors.append(ScanError(stage="discovery", message="Timed out"))

    assert first.scan_id != second.scan_id
    assert second.errors == []
    assert first.started_at.tzinfo is not None


def test_partial_scan_result_preserves_pages_findings_and_errors():
    started_at = datetime.now(timezone.utc)
    context = ScanContext(target_url="https://example.com", started_at=started_at)
    page = ScannedPage(
        url="https://example.com",
        status="scanned",
        title="Example",
        http_status=200,
        duration_ms=120,
    )
    finding = Finding(
        rule_id="metadata.missing_description",
        page=page.url,
        issue_type="Missing Meta Description",
        severity="Low",
        description="Page has no meta description.",
    )
    error = ScanError(
        stage="testing",
        page="https://example.com/about",
        message="Page timed out",
    )

    result = ScanResult(
        scan_id=context.scan_id,
        target_url=context.target_url,
        status="completed_with_errors",
        health_score=92,
        health_status="Excellent",
        summary={"low": 1},
        pages_scanned=1,
        pages_failed=1,
        issues_found=1,
        pages=[page],
        findings=[finding],
        errors=[error],
        started_at=started_at,
    )

    assert result.status == "completed_with_errors"
    assert result.findings == [finding]
    assert result.errors == [error]


@pytest.mark.parametrize("score", [-1, 101])
def test_scan_result_rejects_invalid_health_score(score):
    context = ScanContext(target_url="https://example.com")

    with pytest.raises(ValidationError):
        ScanResult(
            scan_id=context.scan_id,
            target_url=context.target_url,
            status="completed",
            health_score=score,
            health_status="Unknown",
            pages_scanned=0,
            issues_found=0,
            started_at=context.started_at,
        )
