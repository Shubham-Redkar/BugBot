import asyncio
import json

import pytest

from agents import report_agent
from agents.report_agent import enrich_findings
from services.explanation_templates import get_explanation_template


def finding(issue_type: str, index: int = 0) -> dict:
    return {
        "page": f"https://example.com/{index}",
        "issue_type": issue_type,
        "severity": "High",
        "description": "A scanner finding",
        "evidence": {"console_messages": [f"TypeError {index}"]},
    }


@pytest.mark.asyncio
async def test_standard_finding_uses_template_without_llm(monkeypatch):
    async def unexpected_llm_call(*_args, **_kwargs):
        raise AssertionError("LLM should not be called for a standard finding")

    monkeypatch.setattr(report_agent, "generate_json", unexpected_llm_call)

    result = await enrich_findings([finding("Missing Alt Text")])

    template = get_explanation_template("Missing Alt Text")
    assert result[0]["explanation"] == template.explanation
    assert result[0]["fix_suggestion"] == template.fix_suggestion
    assert result[0]["confidence"] == 1.0


@pytest.mark.asyncio
async def test_complex_finding_uses_validated_structured_llm_output(monkeypatch):
    async def structured_response(prompt, _system):
        payload = json.loads(prompt)
        assert payload["evidence"]["console_messages"]
        return {
            "explanation": "The checkout handler reads an undefined value.",
            "impact": "Checkout may stop before payment.",
            "fix_suggestion": "Guard the value and correct its initialization.",
            "confidence": 0.84,
        }

    monkeypatch.setattr(report_agent, "generate_json", structured_response)

    result = await enrich_findings([finding("Console JavaScript Error")])

    assert result[0]["confidence"] == 0.84
    assert "undefined" in result[0]["explanation"]


@pytest.mark.asyncio
async def test_invalid_llm_output_uses_deterministic_fallback(monkeypatch):
    async def invalid_response(*_args):
        return {
            "explanation": "",
            "impact": "",
            "fix_suggestion": "",
            "confidence": 4,
        }

    monkeypatch.setattr(report_agent, "generate_json", invalid_response)

    result = await enrich_findings([finding("Console JavaScript Error")])

    assert result[0]["explanation"]
    assert result[0]["impact"]
    assert result[0]["fix_suggestion"]
    assert result[0]["confidence"] == 0.5


@pytest.mark.asyncio
async def test_llm_calls_respect_concurrency_limit(monkeypatch):
    active = 0
    maximum_active = 0

    async def slow_response(*_args):
        nonlocal active, maximum_active
        active += 1
        maximum_active = max(maximum_active, active)
        await asyncio.sleep(0.01)
        active -= 1
        return {
            "explanation": "Explanation",
            "impact": "Impact",
            "fix_suggestion": "Fix",
            "confidence": 0.8,
        }

    monkeypatch.setattr(report_agent, "generate_json", slow_response)
    findings = [finding("Console JavaScript Error", index) for index in range(6)]

    await enrich_findings(findings, concurrency=2)

    assert maximum_active == 2
