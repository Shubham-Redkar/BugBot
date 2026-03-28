import asyncio
from services.llm_service import call_llm

SYSTEM_PROMPT = (
    "You are a senior QA engineer. Given a website issue, provide a concise explanation, "
    "its user/business impact, and a practical fix. Be specific and actionable. "
    "Respond in exactly this format with no extra text:\n"
    "EXPLANATION: <one or two sentences>\n"
    "IMPACT: <one sentence>\n"
    "FIX: <one or two sentences>"
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
        print(f"[explainer_agent] LLM failed for {issue.get('page')}: {e}")
        issue.setdefault("explanation", "")
        issue.setdefault("impact", "")
        issue.setdefault("fix_suggestion", "")

    return issue


async def explain_all_issues(issues: list[dict]) -> list[dict]:
    return await asyncio.gather(*[explain_issue(issue) for issue in issues])
