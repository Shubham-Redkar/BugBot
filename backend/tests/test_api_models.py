from uuid import uuid4

from models.api_models import CreateScanResponse, ScanResultResponse


def scan_payload() -> dict:
    scan_id = uuid4()
    finding = {
        "rule_id": "javascript.console_error",
        "page": "https://example.com",
        "issue_type": "Console JavaScript Error",
        "severity": "High",
        "description": "One console error was detected.",
        "evidence": {"console_messages": ["TypeError: value is undefined"]},
        "explanation": "A script read an undefined value.",
        "impact": "The affected interaction may fail.",
        "fix_suggestion": "Initialize the value before reading it.",
        "confidence": 0.8,
        "fingerprint": "a" * 64,
    }
    return {
        "scan_id": str(scan_id),
        "url": "https://example.com",
        "target_url": "https://example.com",
        "status": "completed",
        "health_score": 86,
        "health_status": "Good",
        "summary": {"high": 1},
        "pages_scanned": 1,
        "pages_failed": 0,
        "issues_found": 1,
        "pages": [
            {
                "url": "https://example.com",
                "status": "scanned",
                "title": "Example",
                "http_status": 200,
                "duration_ms": 50,
            }
        ],
        "findings": [finding],
        "issues": [finding],
        "errors": [],
        "started_at": "2026-07-12T12:00:00+00:00",
        "completed_at": "2026-07-12T12:00:01+00:00",
        "scan_duration_seconds": 1.0,
    }


def test_scan_result_response_validates_current_payload_shape():
    response = ScanResultResponse.model_validate(scan_payload())

    assert response.findings == response.issues
    assert response.findings[0].rule_id == "javascript.console_error"
    assert response.findings[0].evidence.model_extra == {
        "console_messages": ["TypeError: value is undefined"]
    }


def test_create_scan_response_accepts_uuid_and_typed_result():
    scan_id = uuid4()
    response = CreateScanResponse.model_validate({
        "scan_id": str(scan_id),
        "status": "pending",
        "poll_url": f"/results/{scan_id}",
    })

    assert response.scan_id == scan_id
    assert response.status == "pending"


def test_scan_result_response_supports_pending_state():
    scan_id = uuid4()
    response = ScanResultResponse.model_validate({
        "scan_id": str(scan_id),
        "url": "https://example.com",
        "target_url": "https://example.com",
        "status": "pending",
        "summary": {},
        "pages_scanned": 0,
        "pages_failed": 0,
        "issues_found": 0,
        "pages": [],
        "findings": [],
        "issues": [],
        "errors": [],
        "started_at": "2026-07-12T12:00:00+00:00",
    })

    assert response.health_score is None
    assert response.health_status is None
