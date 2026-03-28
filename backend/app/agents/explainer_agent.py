import asyncio
import re
from services.llm_service import call_llm

SYSTEM_PROMPT = """
You are a senior QA engineer. Given a website issue, provide:
1. A concise explanation
2. Its user/business impact
3. A practical fix

Respond ONLY in this exact format:

EXPLANATION: <one or two sentences>
IMPACT: <one sentence>
FIX: <one or two sentences>
"""


def parse_llm_response(raw: str) -> tuple[str, str, str]:
    """
    Parse LLM output safely even if formatting varies slightly.
    """
    explanation = ""
    impact = ""
    fix = ""

    # Normalize weird spacing
    raw = raw.strip()

    # Regex-based parsing (case-insensitive, multiline safe)
    explanation_match = re.search(r"EXPLANATION:\s*(.*?)(?=\n[A-Z ]+:|$)", raw, re.IGNORECASE | re.DOTALL)
    impact_match = re.search(r"IMPACT:\s*(.*?)(?=\n[A-Z ]+:|$)", raw, re.IGNORECASE | re.DOTALL)
    fix_match = re.search(r"FIX:\s*(.*?)(?=\n[A-Z ]+:|$)", raw, re.IGNORECASE | re.DOTALL)

    if explanation_match:
        explanation = explanation_match.group(1).strip()

    if impact_match:
        impact = impact_match.group(1).strip()

    if fix_match:
        fix = fix_match.group(1).strip()

    return explanation, impact, fix


async def explain_issue(issue: dict) -> dict:
    prompt = (
        f"Issue type: {issue.get('issue_type')}\n"
        f"Severity: {issue.get('severity')}\n"
        f"Page: {issue.get('page')}\n"
        f"Description: {issue.get('description')}"
    )

    try:
        raw = await call_llm(prompt, system=SYSTEM_PROMPT)
        print(f"[explainer_agent] Raw LLM response:\n{raw}\n")

        explanation, impact, fix = parse_llm_response(raw)

        # Fallback defaults if model output is messy
        if not explanation:
            explanation = "This issue may indicate missing or weak frontend validation behavior."

        if not impact:
            impact = "Users may experience confusion, poor UX, or invalid data submission."

        if not fix:
            fix = "Add proper frontend and backend validation, and show clear inline error messages."

        issue["explanation"] = explanation
        issue["impact"] = impact
        issue["fix_suggestion"] = fix

    except Exception as e:
        print(f"[explainer_agent] LLM failed for {issue.get('page')}: {e}")

        issue["explanation"] = "Unable to generate explanation automatically."
        issue["impact"] = "Potential usability or reliability issue."
        issue["fix_suggestion"] = "Review this issue manually and apply validation or UI improvements."

    return issue


async def explain_all_issues(issues: list[dict]) -> list[dict]:
    return await asyncio.gather(*[explain_issue(issue) for issue in issues])
