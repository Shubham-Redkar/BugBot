# from services.playwright_service import test_website
# from agents.explainer_agent import explain_all_issues


# async def run_full_scan(url: str) -> dict:
#     """
#     Full pipeline:
#       1. Crawl + run Playwright tests across all pages.
#       2. Enrich every issue with AI explanation via Grok.
#     Returns the final scan result dict.
#     """
#     print(f"[testing_agent] Starting scan: {url}")

#     result = await test_website(url)

#     if result.get("issues"):
#         print(f"[testing_agent] Enriching {len(result['issues'])} issue(s) with Grok...")
#         result["issues"] = await explain_all_issues(result["issues"])
#         result["issues_found"] = len(result["issues"])

#     print(f"[testing_agent] Done — {result['pages_scanned']} page(s), {result['issues_found']} issue(s).")
#     return result



from services.playwright_service import test_website
from agents.explainer_agent import explain_all_issues


def deduplicate_issues(issues: list) -> list:
    """
    Remove duplicate issues based on:
    - page
    - issue_type
    - description
    """
    seen = set()
    unique_issues = []

    for issue in issues:
        key = (
            issue.get("page", ""),
            issue.get("issue_type", ""),
            issue.get("description", "")
        )

        if key not in seen:
            seen.add(key)
            unique_issues.append(issue)

    return unique_issues


async def run_full_scan(url: str) -> dict:
    """
    Full pipeline:
      1. Crawl + run Playwright tests across all pages.
      2. Remove duplicate issues.
      3. Enrich every unique issue with AI explanation via Grok.
    Returns the final scan result dict.
    """
    print(f"[testing_agent] Starting scan: {url}")

    result = await test_website(url)

    # Ensure issues key always exists
    issues = result.get("issues", [])

    # Deduplicate issues before AI explanation
    unique_issues = deduplicate_issues(issues)

    if unique_issues:
        print(f"[testing_agent] Deduplicated {len(issues)} → {len(unique_issues)} issue(s)")
        print(f"[testing_agent] Enriching {len(unique_issues)} issue(s) with Grok...")

        enriched_issues = await explain_all_issues(unique_issues)

        result["issues"] = enriched_issues
        result["issues_found"] = len(enriched_issues)
    else:
        result["issues"] = []
        result["issues_found"] = 0

    print(f"[testing_agent] Done — {result['pages_scanned']} page(s), {result['issues_found']} issue(s).")
    return result
