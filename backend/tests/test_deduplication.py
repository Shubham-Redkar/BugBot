from services.finding_analysis import deduplicate_findings, finding_fingerprint


def test_deduplication_removes_exact_duplicates():
    base = {
        "page": "https://example.com",
        "issue_type": "Missing Page Title",
        "description": "Page has no title.",
    }

    result = deduplicate_findings([base, base.copy()])

    assert len(result) == 1
    assert result[0]["fingerprint"] == finding_fingerprint(base)


def test_deduplication_keeps_different_descriptions():
    first = {
        "page": "https://example.com",
        "issue_type": "Console JavaScript Error",
        "description": "ReferenceError",
    }
    second = {**first, "description": "TypeError"}

    result = deduplicate_findings([first, second])

    assert [finding["description"] for finding in result] == [
        "ReferenceError",
        "TypeError",
    ]


def test_deduplication_keeps_different_console_evidence():
    first = {
        "page": "https://example.com",
        "issue_type": "Console JavaScript Error",
        "description": "Console errors detected",
        "evidence": {"console_message": "ReferenceError"},
    }
    second = {**first, "evidence": {"console_message": "TypeError"}}

    assert len(deduplicate_findings([first, second])) == 2
