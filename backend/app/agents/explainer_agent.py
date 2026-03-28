from services.llm_service import call_llm

SYSTEM_PROMPT = (
    "You are a senior QA engineer and web accessibility expert. "
    "Given a website issue, provide a concise explanation, its user/business impact, "
    "and a practical fix suggestion. Be specific and actionable."
)


async def explain_issue(issue: dict) -> dict:
    """
    Enrich a single issue dict with AI-generated explanation, impact, and fix_suggestion.
    Returns the updated issue dict.
    """
    prompt = f"""
Issue type: {issue.get('issue_type')}
Severity: {issue.get('severity')}
Page: {issue.get('page')}
Description: {issue.get('description')}

Respond in exactly this format (no markdown, no extra text):
EXPLANATION: <one or two sentences explaining what this issue is>
IMPACT: <one sentence on user or business impact>
FIX: <one or two sentences on how to fix it>
""".strip()

    try:
        raw = await call_llm(prompt, system=SYSTEM_PROMPT)
        explanation, impact, fix = "", "", ""

        for line in raw.splitlines():
            if line.startswith("EXPLANATION:"):
                explanation = line.removeprefix("EXPLANATION:").strip()
            elif line.startswith("IMPACT:"):
                impact = line.removeprefix("IMPACT:").strip()
            elif line.startswith("FIX:"):
                fix = line.removeprefix("FIX:").strip()

        issue["explanation"] = explanation
        issue["impact"] = impact
        issue["fix_suggestion"] = fix

    except Exception as e:
        print(f"[explainer_agent] LLM call failed for issue on {issue.get('page')}: {e}")
        issue.setdefault("explanation", "")
        issue.setdefault("impact", "")
        issue.setdefault("fix_suggestion", "")

    return issue


async def explain_all_issues(issues: list[dict]) -> list[dict]:
    """Enrich every issue in the list concurrently."""
    import asyncio
    return await asyncio.gather(*[explain_issue(issue) for issue in issues])
