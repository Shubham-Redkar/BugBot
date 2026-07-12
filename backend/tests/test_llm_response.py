from agents.explainer_agent import fallback_explanation, parse_llm_response


def test_parse_complete_llm_response():
    raw = """EXPLANATION: The image URL returns an error.
IMPACT: Users cannot see important content.
FIX: Correct the image URL and deploy the missing asset."""

    assert parse_llm_response(raw) == (
        "The image URL returns an error.",
        "Users cannot see important content.",
        "Correct the image URL and deploy the missing asset.",
    )


def test_parse_malformed_llm_response_returns_empty_fields():
    assert parse_llm_response("An unstructured response") == ("", "", "")


def test_known_issue_has_specific_fallback():
    explanation, impact, fix = fallback_explanation("Missing Alt Text")

    assert "alt text" in explanation.lower()
    assert impact
    assert fix
