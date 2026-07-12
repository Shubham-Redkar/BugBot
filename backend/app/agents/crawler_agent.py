from services.playwright_service import crawl_internal_links


async def discover_pages(start_url: str) -> list[str]:
    """Discover all internal pages starting from start_url."""
    try:
        pages = await crawl_internal_links(start_url)
        print(f"[crawler_agent] Found {len(pages)} page(s) from {start_url}")
        return pages
    except Exception as e:
        print(f"[crawler_agent] Failed to crawl {start_url}: {e}")
        return [start_url]
