import asyncio
import concurrent.futures
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from utils.helpers import clean_links
from services.screenshot_service import get_screenshot_path
from models.response_models import ScanResultModel, IssueModel
from utils.constants import MAX_PAGES, HEADLESS


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


def deduplicate_issues(issues: list[dict]) -> list[dict]:
    """
    Deduplicate issues by page + issue type only.
    Prevents duplicate console/image issues on same page.
    """
    seen = set()
    unique_issues = []

    for issue in issues:
        key = (
            issue.get("page", ""),
            issue.get("issue_type", "")
        )

        if key not in seen:
            seen.add(key)
            unique_issues.append(issue)

    return unique_issues


async def _test(start_url: str) -> dict:
    issues = []
    pages_to_test = await _crawl(start_url)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context()

        for idx, url in enumerate(pages_to_test):
            page = await context.new_page()
            console_errors = []

            # -------------------------
            # Capture console errors
            # -------------------------
            page.on(
                "console",
                lambda msg: console_errors.append(msg.text)
                if msg.type == "error"
                else None
            )

            try:
                response = await page.goto(url, wait_until="load", timeout=15000)
                await page.wait_for_timeout(1500)

                # -------------------------
                # 1) Broken page check
                # -------------------------
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

                # -------------------------
                # 2) Missing alt text
                # -------------------------
                images_without_alt = await page.locator("img:not([alt]), img[alt='']").count()

                if images_without_alt > 0:
                    screenshot = get_screenshot_path("missing_alt", idx)
                    await page.screenshot(path=screenshot, full_page=True)

                    issues.append(IssueModel(
                        page=url,
                        issue_type="Missing Alt Text",
                        severity="Medium",
                        description=f"{images_without_alt} image(s) missing alt text.",
                        screenshot=screenshot,
                    ).model_dump())

                # -------------------------
                # 3) Broken images
                # -------------------------
                broken_images = await page.evaluate("""
                    () => {
                        return Array.from(document.images).filter(img =>
                            !img.complete || img.naturalWidth === 0
                        ).length;
                    }
                """)

                if broken_images > 0:
                    screenshot = get_screenshot_path("broken_images", idx)
                    await page.screenshot(path=screenshot, full_page=True)

                    issues.append(IssueModel(
                        page=url,
                        issue_type="Broken Images",
                        severity="Medium",
                        description=f"{broken_images} broken image(s) detected.",
                        screenshot=screenshot,
                    ).model_dump())

                # -------------------------
                # 4) Console JS errors (filtered)
                # -------------------------
                filtered_console_errors = [
                    err for err in console_errors
                    if not any(ignore in err.lower() for ignore in [
                        "favicon",
                        "google-analytics",
                        "analytics",
                        "gtag",
                        "doubleclick",
                        "ads",
                        "net::err_name_not_resolved"
                    ])
                ]

                if filtered_console_errors:
                    screenshot = get_screenshot_path("console_error", idx)
                    await page.screenshot(path=screenshot, full_page=True)

                    issues.append(IssueModel(
                        page=url,
                        issue_type="Console JavaScript Error",
                        severity="Medium",
                        description=f"{len(filtered_console_errors)} console error(s) detected. Example: {filtered_console_errors[0][:120]}",
                        screenshot=screenshot,
                    ).model_dump())

                # -------------------------
                # 5) Invalid email acceptance check only
                # -------------------------
                forms = page.locator("form")
                form_count = await forms.count()

                for form_index in range(form_count):
                    form = forms.nth(form_index)

                    try:
                        if not await form.is_visible():
                            continue
                    except Exception:
                        continue

                    try:
                        email_input = form.locator("input[type='email']")
                        submit_btn = form.locator("button[type='submit'], input[type='submit']")

                        if await email_input.count() == 0 or await submit_btn.count() == 0:
                            continue

                        try:
                            await email_input.first.fill("invalid-email")
                            await submit_btn.first.click(timeout=3000)
                            await page.wait_for_timeout(1000)
                        except Exception:
                            pass

                        validation_errors = await form.locator(
                            ".error, .invalid, [aria-invalid='true'], .help-block, .form-error"
                        ).count()

                        invalid_inputs = await form.locator(":invalid").count()

                        # Only flag issue if invalid email appears to be accepted
                        if validation_errors == 0 and invalid_inputs == 0:
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

    issues = deduplicate_issues(issues)

    return ScanResultModel(
        url=start_url,
        pages_scanned=len(pages_to_test),
        issues_found=len(issues),
        issues=issues,
    ).model_dump()


def _run_in_thread(coro):
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


async def crawl_internal_links(start_url: str) -> list[str]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_in_thread, _crawl(start_url))


async def test_website(start_url: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_in_thread, _test(start_url))
