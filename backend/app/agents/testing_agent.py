from agents.crawler_agent import discover_pages
from agents.explainer_agent import explain_all_issues
from services.playwright_service import test_website


async def run_full_scan(url: str) -> dict:
    """
    Full pipeline:
      1. Crawl to discover pages.
      2. Run Playwright tests across all pages.
      3. Enrich every issue with AI explanations.
    Returns the final scan result dict.
    """
    print(f"[testing_agent] Starting full scan for: {url}")

    # Step 1 + 2: crawl & test (playwright_service already crawls internally,
    # but we expose the agent boundary here for future separation)
    result = await test_website(url)

    # Step 3: AI enrichment
    if result.get("issues"):
        print(f"[testing_agent] Enriching {len(result['issues'])} issue(s) with LLM …")
        result["issues"] = await explain_all_issues(result["issues"])
        # Keep issues_found count in sync
        result["issues_found"] = len(result["issues"])

    print(f"[testing_agent] Scan complete — {result['pages_scanned']} page(s), "
          f"{result['issues_found']} issue(s) found.")
    return result
