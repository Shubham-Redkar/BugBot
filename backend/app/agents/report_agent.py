import asyncio
import json
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from config import get_settings
from services.explanation_templates import (
    get_explanation_template,
    has_explanation_template,
)
from services.llm_service import generate_json


COMPLEX_ISSUE_TYPES = {
    "Console JavaScript Error",
    "Broken Page",
    "Page Load Failure",
    "Page Scan Failure",
}

SYSTEM_PROMPT = """You are a senior QA engineer analyzing one scanner finding.
Use only the supplied finding and evidence. Do not invent a root cause.
Return exactly one JSON object with these keys:
explanation, impact, fix_suggestion, confidence.
The three text values must be concise. Confidence must be between 0 and 1.
"""


class ExplanationResult(BaseModel):
    explanation: str = Field(min_length=1)
    impact: str = Field(min_length=1)
    fix_suggestion: str = Field(min_length=1)
    confidence: float = Field(ge=0, le=1)


def template_result(issue_type: str) -> ExplanationResult:
    template = get_explanation_template(issue_type)
    return ExplanationResult(
        explanation=template.explanation,
        impact=template.impact,
        fix_suggestion=template.fix_suggestion,
        confidence=1.0 if issue_type not in COMPLEX_ISSUE_TYPES else 0.5,
    )


def needs_llm(finding: dict[str, Any]) -> bool:
    issue_type = str(finding.get("issue_type", ""))
    return issue_type in COMPLEX_ISSUE_TYPES or not has_explanation_template(issue_type)


async def enrich_finding(
    finding: dict[str, Any], semaphore: asyncio.Semaphore
) -> dict[str, Any]:
    issue_type = str(finding.get("issue_type", ""))
    result = template_result(issue_type)

    if needs_llm(finding):
        prompt = json.dumps(
            {
                "issue_type": issue_type,
                "severity": finding.get("severity"),
                "page": finding.get("page"),
                "description": finding.get("description"),
                "evidence": finding.get("evidence", {}),
            },
            default=str,
        )
        try:
            async with semaphore:
                result = ExplanationResult.model_validate(
                    await generate_json(prompt, SYSTEM_PROMPT)
                )
        except (ValidationError, ValueError, RuntimeError, json.JSONDecodeError):
            # A report remains useful and deterministic when AI is unavailable.
            result = template_result(issue_type)
        except Exception:
            result = template_result(issue_type)

    enriched = dict(finding)
    enriched.update(result.model_dump())
    return enriched


async def enrich_findings(
    findings: list[dict[str, Any]], concurrency: int | None = None
) -> list[dict[str, Any]]:
    if concurrency is None:
        concurrency = get_settings().llm_concurrency
    semaphore = asyncio.Semaphore(max(1, concurrency))
    return await asyncio.gather(
        *(enrich_finding(finding, semaphore) for finding in findings)
    )
