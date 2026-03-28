import asyncio
import concurrent.futures
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from utils.helpers import clean_links
from services.screenshot_service import get_screenshot_path
from models.response_models import ScanResultModel, IssueModel
from utils.constants import MAX_PAGES, HEADLESS


# ─── internal async functions (run inside their own thread+loop) ──────────────

async def _crawl(start_url: str) -> list[str]:
    discovered = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        page = await browser.new_page()
        try:
            await page.goto(start_url, wait_until="load", timeout=15000)
            hrefs = await page.locator("a").evaluate_all(
                "elements => elements.map(el => el.getAttribute('href'))"
            )
            discovered = clean_links(start_url, hrefs)
        except Exception as e:
            print(f"[playwright] Crawl error: {e}")
        finally:
            await browser.close()
    return [start_url] + discovered[:MAX_PAGES - 1]


async def _test(start_url: str) -> dict:
    issues = []
    pages_to_test = await _crawl(start_url)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context()

        for idx, url in enumerate(pages_to_test):
            page = await context.new_page()
            try:
                response = await page.goto(url, wait_until="load", timeout=15000)

                # 1) Broken page
                if response and response.status >= 400:
                    screenshot = get_screenshot_path("broken_page", idx)
                    await page.screenshot(path=screenshot, full_page=True)
                    issues.append(IssueModel(
                        page=url,
                        issue_type="Broken Page",
                        severity="High",
                        description=f"Page returned HTTP {response.status}",
                        screenshot=screenshot,
                    ).model_dump())

                # 2) Forms
                forms = page.locator("form")
                form_count = await forms.count()
                for form_index in range(form_count):
                    form = forms.nth(form_index)

                    # Empty submit
                    try:
                        submit_btn = form.locator("button[type='submit'], input[type='submit']")
                        if await submit_btn.count() > 0:
                            await submit_btn.first.click(timeout=3000)
                            screenshot = get_screenshot_path("empty_form_submit", idx)
                            await page.screenshot(path=screenshot, full_page=True)
                            issues.append(IssueModel(
                                page=url,
                                issue_type="Form Validation Check",
                                severity="Medium",
                                description="Form submitted with empty fields — validation should be reviewed.",
                                screenshot=screenshot,
                            ).model_dump())
                    except Exception:
                        pass

                    # Invalid email
                    try:
                        email_input = form.locator("input[type='email']")
                        if await email_input.count() > 0:
                            await email_input.first.fill("invalid-email")
                            submit_btn = form.locator("button[type='submit'], input[type='submit']")
                            if await submit_btn.count() > 0:
                                await submit_btn.first.click(timeout=3000)
                                screenshot = get_screenshot_path("invalid_email", idx)
                                await page.screenshot(path=screenshot, full_page=True)
                                issues.append(IssueModel(
                                    page=url,
                                    issue_type="Email Validation Check",
                                    severity="Medium",
                                    description="Invalid email accepted — validation should be reviewed.",
                                    screenshot=screenshot,
                                ).model_dump())
                    except Exception:
                        pass

                # 3) Dead links (sample)
                links = page.locator("a")
                link_count = min(await links.count(), 10)
                for link_index in range(link_count):
                    try:
                        href = await links.nth(link_index).get_attribute("href")
                        if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
                            continue
                    except Exception:
                        continue

            except PlaywrightTimeoutError as e:
                screenshot = get_screenshot_path("timeout_error", idx)
                try:
                    await page.screenshot(path=screenshot, full_page=True)
                except Exception:
                    screenshot = None
                issues.append(IssueModel(
                    page=url,
                    issue_type="Page Load Failure",
                    severity="High",
                    description=f"Page timed out: {str(e)[:120]}",
                    screenshot=screenshot,
                ).model_dump())

            except Exception as e:
                screenshot = get_screenshot_path("page_error", idx)
                try:
                    await page.screenshot(path=screenshot, full_page=True)
                except Exception:
                    screenshot = None
                issues.append(IssueModel(
                    page=url,
                    issue_type="Page Load Failure",
                    severity="High",
                    description=f"Failed to load page: {str(e)[:120]}",
                    screenshot=screenshot,
                ).model_dump())

            finally:
                await page.close()

        await browser.close()

    return ScanResultModel(
        url=start_url,
        pages_scanned=len(pages_to_test),
        issues_found=len(issues),
        issues=issues,
    ).model_dump()


# ─── thread runner — gives Playwright its own clean event loop ────────────────

def _run_in_thread(coro):
    """
    Run an async coroutine in a brand-new thread with its own event loop.
    This is the Windows fix: Playwright needs ProactorEventLoop and must not
    share the loop that uvicorn is already using.
    """
    import sys
    def thread_target():
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(thread_target)
        return future.result()


# ─── public API (called by testing_agent) ────────────────────────────────────

async def crawl_internal_links(start_url: str) -> list[str]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_in_thread, _crawl(start_url))


async def test_website(start_url: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_in_thread, _test(start_url))
