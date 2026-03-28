import asyncio
import re
from services.llm_service import call_llm

SYSTEM_PROMPT = """
You are a senior QA engineer.

You MUST explain the issue based on the actual issue type and description.
Do NOT give generic frontend validation advice unless the issue is truly about validation.

Examples:
- Broken Images → explain missing/broken image assets
- Missing Alt Text → explain accessibility issue
- Console JavaScript Error → explain frontend JS/resource issue
- Broken Page → explain HTTP error / access issue
- Form Validation Check → explain missing validation
- Email Validation Check → explain invalid email acceptance

Respond ONLY in this exact format:

EXPLANATION: <one or two sentences>
IMPACT: <one sentence>
FIX: <one or two sentences>
"""


def parse_llm_response(raw: str) -> tuple[str, str, str]:
    explanation = ""
    impact = ""
    fix = ""

    raw = raw.strip()

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


def fallback_explanation(issue_type: str) -> tuple[str, str, str]:
    issue_type = (issue_type or "").lower()

    if "broken images" in issue_type:
        return (
            "Some image assets failed to load correctly, likely due to invalid file paths or missing resources.",
            "Users may see broken visuals, reducing trust and harming the browsing experience.",
            "Verify image URLs, ensure files exist on the server, and handle image loading failures gracefully."
        )

    if "missing alt text" in issue_type:
        return (
            "Some images are missing alt text, which reduces accessibility for screen reader users.",
            "This can make the site less usable for visually impaired users and hurt accessibility compliance.",
            "Add meaningful alt text to informative images and use empty alt attributes only for decorative images."
        )

    if "console javascript error" in issue_type:
        return (
            "The page is generating JavaScript or resource-loading errors in the browser console.",
            "Frontend errors can break features, reduce reliability, or create inconsistent user experiences.",
            "Inspect the failing script or resource, fix broken asset references, and resolve any JavaScript exceptions."
        )

    if "broken page" in issue_type:
        return (
            "The page returned an HTTP error and could not be accessed normally during the scan.",
            "Users may be blocked from viewing content or completing actions on this page.",
            "Check route protection, server configuration, and page availability. Allow authenticated access if needed."
        )

    if "form validation" in issue_type:
        return (
            "The form appears to allow submission without clearly enforcing required fields.",
            "Users may submit incomplete or invalid data, reducing data quality and causing downstream issues.",
            "Add clear client-side and server-side validation with inline error feedback."
        )

    if "email validation" in issue_type:
        return (
            "The form appears to accept an invalid email format without proper validation.",
            "Invalid email data can cause failed communication, bad records, and poor user experience.",
            "Validate email format on both frontend and backend, and show a clear inline validation message."
        )

    return (
        "This issue may affect usability, accessibility, or functionality.",
        "Users may experience confusion, broken behavior, or reduced trust.",
        "Review the affected component and implement a targeted fix based on the issue type."
    )


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

        if not explanation or not impact or not fix:
            explanation, impact, fix = fallback_explanation(issue.get("issue_type", ""))

        issue["explanation"] = explanation
        issue["impact"] = impact
        issue["fix_suggestion"] = fix

    except Exception as e:
        print(f"[explainer_agent] LLM failed for {issue.get('page')}: {e}")

        explanation, impact, fix = fallback_explanation(issue.get("issue_type", ""))

        issue["explanation"] = explanation
        issue["impact"] = impact
        issue["fix_suggestion"] = fix

    return issue


async def explain_all_issues(issues: list[dict]) -> list[dict]:
    return await asyncio.gather(*[explain_issue(issue) for issue in issues])
