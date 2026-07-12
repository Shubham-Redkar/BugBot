import pytest

from agents import scan_coordinator


def raw_scan_result():
    return {
        "url": "https://example.com",
        "pages_scanned": 2,
        "issues": [
            {
                "page": "https://example.com",
                "issue_type": "Missing Page Title",
                "severity": "Medium",
                "description": "Page has no title",
            }
        ],
        "scanned_at": "2026-07-12T12:00:00+00:00",
        "scan_duration_seconds": 1.5,
        "errors": [],
    }


@pytest.mark.asyncio
async def test_coordinator_returns_legacy_and_new_finding_fields(monkeypatch):
    async def fake_test_website(_url):
        return raw_scan_result()

    async def fake_explain(findings):
        return findings

    monkeypatch.setattr(scan_coordinator, "test_website", fake_test_website)
    monkeypatch.setattr(scan_coordinator, "enrich_findings", fake_explain)

    result = await scan_coordinator.run_scan("https://example.com")

    assert result["status"] == "completed"
    assert result["target_url"] == "https://example.com"
    assert result["issues"] == result["findings"]
    assert result["issues_found"] == 1
    assert result["scan_id"]
    assert result["completed_at"]


@pytest.mark.asyncio
async def test_explanation_failure_preserves_deterministic_findings(monkeypatch):
    async def fake_test_website(_url):
        return raw_scan_result()

    async def failed_explanation(_findings):
        raise RuntimeError("LLM unavailable")

    monkeypatch.setattr(scan_coordinator, "test_website", fake_test_website)
    monkeypatch.setattr(
        scan_coordinator, "enrich_findings", failed_explanation
    )

    result = await scan_coordinator.run_scan("https://example.com")

    assert result["status"] == "completed_with_errors"
    assert result["issues_found"] == 1
    assert result["errors"][0]["stage"] == "explanation"


@pytest.mark.asyncio
async def test_page_failure_sets_partial_status(monkeypatch):
    raw = raw_scan_result()
    raw["issues"] = [
        {
            "page": "https://example.com/slow",
            "issue_type": "Page Load Failure",
            "severity": "High",
            "description": "Timeout",
        }
    ]

    async def fake_test_website(_url):
        return raw

    async def fake_explain(findings):
        return findings

    monkeypatch.setattr(scan_coordinator, "test_website", fake_test_website)
    monkeypatch.setattr(scan_coordinator, "enrich_findings", fake_explain)

    result = await scan_coordinator.run_scan("https://example.com")

    assert result["status"] == "completed_with_errors"
    assert result["pages_failed"] == 1
