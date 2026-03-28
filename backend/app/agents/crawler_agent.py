from services.playwright_service import crawl_internal_links


async def discover_pages(start_url: str) -> list[str]:
    """
    Agent wrapper: discovers all internal pages starting from start_url.
    Returns an ordered list of URLs to test (start_url always first).
    """
    try:
        pages = await crawl_internal_links(start_url)
        print(f"[crawler_agent] Discovered {len(pages)} page(s) from {start_url}")
        return pages
    except Exception as e:
        print(f"[crawler_agent] Failed to crawl {start_url}: {e}")
        return [start_url]
