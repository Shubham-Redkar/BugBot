from services.finding_analysis import analyze_findings, finding_fingerprint


def test_fingerprint_is_stable_across_dictionary_order():
    first = {
        "page": "https://example.com",
        "issue_type": "Broken Images",
        "description": "One broken image",
        "evidence": {"resource_url": "/missing.png", "selector": "main img"},
    }
    second = {
        "description": "One broken image",
        "issue_type": "Broken Images",
        "page": "https://example.com",
        "evidence": {"selector": "main img", "resource_url": "/missing.png"},
    }

    assert finding_fingerprint(first) == finding_fingerprint(second)


def test_analysis_deduplicates_prioritizes_and_scores_findings():
    low = {
        "page": "https://example.com",
        "issue_type": "Missing Meta Description",
        "severity": "Low",
        "description": "Missing description",
    }
    high = {
        "page": "https://example.com",
        "issue_type": "Broken Images",
        "severity": "High",
        "description": "2 broken images",
    }

    result = analyze_findings([low, high, high.copy()], pages_scanned=1)

    assert len(result.findings) == 2
    assert result.findings[0]["severity"] == "High"
    assert result.summary["high"] == 1
    assert result.summary["low"] == 1
    assert 0 <= result.health_score <= 100
