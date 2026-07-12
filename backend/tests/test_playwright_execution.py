import asyncio

import pytest

from services import playwright_service
from services.playwright_service import PageScanResult, _scan_pages_with_timeout
from services.screenshot_service import get_screenshot_path


def test_screenshot_paths_are_unique_even_with_same_prefix_and_index():
    first = get_screenshot_path("console_errors", 0)
    second = get_screenshot_path("console_errors", 0)

    assert first != second
    assert first.endswith(".png")
    assert second.endswith(".png")


def test_page_result_exposes_relational_metadata():
    result = PageScanResult(
        url="https://example.com",
        title="Example",
        http_status=200,
        duration_ms=45,
    )

    assert result.as_dict() == {
        "url": "https://example.com",
        "status": "scanned",
        "title": "Example",
        "http_status": 200,
        "duration_ms": 45,
        "error": None,
    }


@pytest.mark.asyncio
async def test_global_timeout_preserves_completed_page_results(monkeypatch):
    async def fake_scan_page(_context, url, _idx):
        if url.endswith("/slow"):
            await asyncio.sleep(1)
        return PageScanResult(
            url=url,
            title="Completed page",
            issues=[{"page": url, "issue_type": "Completed finding"}],
        )

    monkeypatch.setattr(playwright_service, "_scan_page", fake_scan_page)
    pages = ["https://example.com/fast", "https://example.com/slow"]

    results = await _scan_pages_with_timeout(object(), pages, timeout=0.02)

    assert results[0].title == "Completed page"
    assert results[0].issues[0]["issue_type"] == "Completed finding"
    assert results[0].timed_out is False
    assert results[1].timed_out is True
    assert results[1].issues[0]["issue_type"] == "Page Load Failure"


@pytest.mark.asyncio
async def test_page_scan_results_remain_in_input_order(monkeypatch):
    async def fake_scan_page(_context, url, idx):
        await asyncio.sleep(0.01 if idx == 0 else 0)
        return PageScanResult(url=url, title=str(idx))

    monkeypatch.setattr(playwright_service, "_scan_page", fake_scan_page)
    pages = ["https://example.com/one", "https://example.com/two"]

    results = await _scan_pages_with_timeout(object(), pages, timeout=1)

    assert [result.url for result in results] == pages
    assert [result.title for result in results] == ["0", "1"]
