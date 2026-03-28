import asyncio
import re
from services.llm_service import call_llm

SYSTEM_PROMPT = """
You are a senior QA engineer.

You MUST explain the issue based on the actual issue type and description.
Do NOT give generic frontend validation advice unless the issue is truly about validation.

Examples:
- Broken Images → explain missing/broken image assets
- Missing Alt Text → explain accessibility issue with images
- Console JavaScript Error → explain frontend JS/resource issue
- Broken Page → explain HTTP error / access issue
- Page Load Failure → explain timeout / connectivity issue
- Required Field Validation → explain missing required field validation
- Email Validation Check → explain missing email field validation
- Password Validation Check → explain weak password validation
- Missing Form Labels → explain accessibility issue for unlabeled form fields
- Insecure Form Submission → explain insecure form action issue
- Missing Page Title → explain SEO/usability issue
- Missing Meta Description → explain SEO/search snippet issue
- Empty Buttons → explain accessibility/usability issue for unlabeled buttons
- Empty Links → explain accessibility/navigation issue for unlabeled links

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

    explanation_match = re.search(
        r"EXPLANATION:\s*(.*?)(?=\n[A-Z]+:|$)", raw, re.IGNORECASE | re.DOTALL
    )
    impact_match = re.search(
        r"IMPACT:\s*(.*?)(?=\n[A-Z]+:|$)", raw, re.IGNORECASE | re.DOTALL
    )
    # FIX is the last field — greedy match to end of string
    fix_match = re.search(r"FIX:\s*(.*)", raw, re.IGNORECASE | re.DOTALL)

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
            "Verify image URLs, ensure files exist on the server, and handle image loading failures gracefully.",
        )

    if "missing alt text" in issue_type:
        return (
            "Some images are missing alt text, which reduces accessibility for screen reader users.",
            "This can make the site less usable for visually impaired users and hurt accessibility compliance.",
            "Add meaningful alt text to informative images and use empty alt attributes only for decorative images.",
        )

    if "console javascript error" in issue_type:
        return (
            "The page is generating JavaScript or resource-loading errors in the browser console.",
            "Frontend errors can break features, reduce reliability, or create inconsistent user experiences.",
            "Inspect the failing script or resource, fix broken asset references, and resolve any JavaScript exceptions.",
        )

    if "broken page" in issue_type:
        return (
            "The page returned an HTTP error and could not be accessed normally during the scan.",
            "Users may be blocked from viewing content or completing actions on this page.",
            "Check route protection, server configuration, and page availability. Allow authenticated access if needed.",
        )

    if "page load failure" in issue_type:
        return (
            "The page did not respond within the allowed time during the scan.",
            "Slow or unresponsive pages increase bounce rates and degrade user experience.",
            "Investigate server response times, reduce blocking resources, and consider a CDN or caching layer.",
        )

    if "required field validation" in issue_type:
        return (
            "The form appears to allow submission without enforcing required fields.",
            "Users may submit incomplete data, leading to poor data quality and broken workflows.",
            "Add clear client-side and server-side validation for required fields and show inline error messages.",
        )

    if "email validation" in issue_type:
        return (
            "The email field does not use type='email' or a pattern attribute to enforce a valid format.",
            "Invalid email addresses can be submitted, causing delivery failures and data quality issues.",
            "Set type='email' on the input or add a pattern attribute with an appropriate regex.",
        )

    if "password validation" in issue_type:
        return (
            "The password field accepts input without enforcing minimum length or complexity rules.",
            "Weak password rules can reduce account security and increase the risk of unauthorized access.",
            "Enforce minimum password requirements such as length, complexity, and validation feedback.",
        )

    if "missing form labels" in issue_type:
        return (
            "Some form fields do not have visible or accessible labels.",
            "Users may struggle to understand the purpose of these fields, especially when using assistive technologies.",
            "Add proper <label> elements or aria-label/aria-labelledby attributes for all form fields.",
        )

    if "insecure form submission" in issue_type:
        return (
            "The form appears to submit user data over an insecure HTTP connection.",
            "Sensitive information may be exposed during transmission, creating a security risk.",
            "Ensure all form submissions use HTTPS and secure transport.",
        )

    if "missing page title" in issue_type:
        return (
            "The page does not have a <title> element, or it is blank.",
            "Users and search engines may struggle to understand the page content, hurting SEO and usability.",
            "Add a meaningful and unique <title> tag for each page.",
        )

    if "missing meta description" in issue_type:
        return (
            "The page lacks a meta description tag.",
            "Search engines may generate poor snippets, reducing click-through rates from search results.",
            "Add a concise and relevant meta description for each page.",
        )

    if "empty buttons" in issue_type:
        return (
            "Some buttons do not have visible text or an accessible aria-label or title attribute.",
            "Users relying on screen readers or keyboard navigation cannot determine the button's purpose.",
            "Add visible label text or an aria-label attribute so each button clearly communicates its action.",
        )

    if "empty links" in issue_type:
        return (
            "Some anchor elements have no visible text, aria-label, or labelled child image.",
            "Screen reader users and keyboard navigators cannot determine where the link leads.",
            "Add meaningful link text or an aria-label attribute so each link clearly describes its destination.",
        )

    return (
        "This issue may affect usability, accessibility, or functionality.",
        "Users may experience confusion, broken behavior, or reduced trust.",
        "Review the affected component and implement a targeted fix based on the issue type.",
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
