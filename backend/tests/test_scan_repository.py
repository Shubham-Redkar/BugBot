from uuid import UUID, uuid4

from db.tables import PageStatus, ScanStatus, Severity
from repositories.scan_repository import build_scan_record, scan_to_dict


def scan_result() -> dict:
    scan_id = uuid4()
    return {
        "scan_id": str(scan_id),
        "url": "https://example.com",
        "target_url": "https://example.com",
        "status": "completed_with_errors",
        "health_score": 81,
        "health_status": "Good",
        "summary": {"high": 1},
        "pages_scanned": 2,
        "pages_failed": 1,
        "issues_found": 1,
        "pages": [
            {
                "url": "https://example.com",
                "status": "scanned",
                "title": "Example",
                "http_status": 200,
                "duration_ms": 120,
                "error": None,
            },
            {
                "url": "https://example.com/slow",
                "status": "timed_out",
                "title": None,
                "http_status": None,
                "duration_ms": 15000,
                "error": "Page load timeout",
            },
        ],
        "findings": [
            {
                "rule_id": "page.load_failure",
                "page": "https://example.com/slow",
                "issue_type": "Page Load Failure",
                "severity": "High",
                "description": "Timeout",
                "evidence": {"http_status": None},
                "explanation": "The page did not load.",
                "impact": "Users may not reach the page.",
                "fix_suggestion": "Review server performance.",
                "confidence": 0.8,
                "fingerprint": "a" * 64,
            }
        ],
        "errors": [
            {
                "stage": "testing",
                "page": "https://example.com/slow",
                "message": "Page load timeout",
            }
        ],
        "started_at": "2026-07-12T12:00:00+00:00",
        "completed_at": "2026-07-12T12:00:02+00:00",
        "scan_duration_seconds": 2.0,
    }


def test_build_scan_record_maps_complete_result_graph():
    result = scan_result()
    scan = build_scan_record(result)

    assert scan.id == UUID(result["scan_id"])
    assert scan.status is ScanStatus.COMPLETED_WITH_ERRORS
    assert len(scan.pages) == 2
    assert scan.pages[1].status is PageStatus.TIMED_OUT
    assert len(scan.findings) == 1
    assert scan.findings[0].severity is Severity.HIGH
    assert scan.findings[0].page is scan.pages[1]
    assert len(scan.errors) == 1


def test_scan_serialization_preserves_current_and_new_api_fields():
    scan = build_scan_record(scan_result())

    serialized = scan_to_dict(scan)

    assert serialized["issues"] == serialized["findings"]
    assert serialized["status"] == "completed_with_errors"
    assert serialized["findings"][0]["severity"] == "High"
    assert serialized["findings"][0]["page"] == "https://example.com/slow"
    assert serialized["pages"][1]["status"] == "timed_out"


def test_unknown_severity_is_normalized():
    result = scan_result()
    result["findings"][0]["severity"] = "unexpected"

    scan = build_scan_record(result)

    assert scan.findings[0].severity is Severity.UNKNOWN
