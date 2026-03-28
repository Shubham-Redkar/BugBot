from services.playwright_service import test_website
from agents.explainer_agent import explain_all_issues


async def run_full_scan(url: str) -> dict:
    """
    Full pipeline:
      1. Crawl + run Playwright tests across all pages.
      2. Enrich every issue with AI explanation via Grok.
    Returns the final scan result dict.
    """
    print(f"[testing_agent] Starting scan: {url}")

    result = await test_website(url)

    if result.get("issues"):
        print(f"[testing_agent] Enriching {len(result['issues'])} issue(s) with Grok...")
        result["issues"] = await explain_all_issues(result["issues"])
        result["issues_found"] = len(result["issues"])

    print(f"[testing_agent] Done — {result['pages_scanned']} page(s), {result['issues_found']} issue(s).")
    return result
