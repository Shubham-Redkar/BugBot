from agents.testing_agent import deduplicate_issues as pipeline_deduplicate
from services.playwright_service import deduplicate_issues as scanner_deduplicate


def test_pipeline_deduplication_removes_exact_duplicates():
    base = {
        "page": "https://example.com",
        "issue_type": "Missing Page Title",
        "description": "Page has no title.",
    }

    assert pipeline_deduplicate([base, base.copy()]) == [base]


def test_pipeline_deduplication_keeps_different_descriptions():
    first = {
        "page": "https://example.com",
        "issue_type": "Console JavaScript Error",
        "description": "ReferenceError",
    }
    second = {**first, "description": "TypeError"}

    assert pipeline_deduplicate([first, second]) == [first, second]


def test_scanner_deduplication_documents_current_page_type_behavior():
    first = {
        "page": "https://example.com",
        "issue_type": "Console JavaScript Error",
        "description": "ReferenceError",
    }
    second = {**first, "description": "TypeError"}

    # This captures the existing behavior. A later analysis refactor can change it
    # deliberately alongside this regression test.
    assert scanner_deduplicate([first, second]) == [first]
