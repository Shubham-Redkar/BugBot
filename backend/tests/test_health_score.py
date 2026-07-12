from services.playwright_service import calculate_health_score, extract_count


def test_empty_scan_has_perfect_health_score():
    score, summary, status = calculate_health_score([], pages_scanned=1)

    assert score == 100
    assert summary == {"high": 0, "medium": 0, "low": 0}
    assert status == "Excellent"


def test_health_score_counts_severities_and_stays_in_range():
    issues = [
        {
            "issue_type": "Broken Images",
            "severity": "High",
            "description": "25 broken images detected.",
        },
        {
            "issue_type": "Missing Alt Text",
            "severity": "Medium",
            "description": "3 images missing alt text.",
        },
        {
            "issue_type": "Missing Meta Description",
            "severity": "Low",
            "description": "Page has no meta description.",
        },
    ]

    score, summary, status = calculate_health_score(issues, pages_scanned=2)

    assert 0 <= score <= 100
    assert summary == {"high": 1, "medium": 1, "low": 1}
    assert status in {"Excellent", "Good", "Fair", "Poor"}


def test_extract_count_uses_first_number_and_defaults_to_one():
    assert extract_count("12 broken images on 3 pages") == 12
    assert extract_count("No count included") == 1
