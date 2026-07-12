import asyncio
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urljoin
from playwright.async_api import (
    async_playwright,
    TimeoutError as PlaywrightTimeoutError,
)
from config import get_settings
from utils.helpers import clean_links
from services.screenshot_service import get_screenshot_path
from models.response_models import IssueModel


@dataclass
class PageScanResult:
    url: str
    title: str = ""
    issues: list[dict] = field(default_factory=list)
    timed_out: bool = False
    http_status: int | None = None
    duration_ms: int | None = None
    error: str | None = None

    def as_dict(self) -> dict:
        status = "timed_out" if self.timed_out else "failed" if self.error else "scanned"
        return {
            "url": self.url,
            "status": status,
            "title": self.title or None,
            "http_status": self.http_status,
            "duration_ms": self.duration_ms,
            "error": self.error,
        }


async def _crawl(start_url: str) -> list[str]:
    settings = get_settings()
    discovered = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=settings.headless)
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

    return [start_url] + discovered[: settings.max_pages - 1]


async def _check_required_field_validation(page, form, url, idx, issues):
    try:
        inputs = form.locator("input:not([type='hidden']), textarea, select")
        if await inputs.count() < 2:
            return

        required = form.locator("[required]")
        if await required.count() == 0:
            path = get_screenshot_path("required_field", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Required Field Validation",
                    severity="High",
                    description="Form has inputs but no required field validation.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_required_field_validation error on {url}: {e}")


async def _check_email_validation(page, form, url, idx, issues):
    try:
        email = form.locator("input[type='email'], input[name*='email' i]")
        if await email.count() == 0:
            return

        field = email.first
        field_type = await field.get_attribute("type")
        pattern = await field.get_attribute("pattern")

        if field_type != "email" and not pattern:
            path = get_screenshot_path("email_validation", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Email Validation Check",
                    severity="High",
                    description="Email field lacks proper validation.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_email_validation error on {url}: {e}")


async def _check_password_validation(page, form, url, idx, issues):
    try:
        pwd = form.locator("input[type='password']")
        if await pwd.count() == 0:
            return

        field = pwd.first
        minlength = await field.get_attribute("minlength")
        pattern = await field.get_attribute("pattern")

        if not minlength and not pattern:
            path = get_screenshot_path("password_validation", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Password Validation Check",
                    severity="Medium",
                    description="Password field lacks strength rules.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_password_validation error on {url}: {e}")


async def _check_missing_form_labels(page, form, url, idx, issues):
    try:
        count = await form.locator("input, textarea, select").evaluate_all(
            """
            els => els.filter(el =>
                !el.labels?.length &&
                !el.getAttribute("aria-label") &&
                !el.getAttribute("placeholder")
            ).length
        """
        )

        if count > 0:
            path = get_screenshot_path("missing_labels", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Missing Form Labels",
                    severity="Medium",
                    description=f"{count} fields missing labels.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_missing_form_labels error on {url}: {e}")


async def _check_insecure_form_submission(page, form, url, idx, issues):
    try:
        action = await form.get_attribute("action")
        if action and urljoin(url, action).startswith("http://"):
            path = get_screenshot_path("insecure_form", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Insecure Form Submission",
                    severity="High",
                    description="Form submits over HTTP.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_insecure_form_submission error on {url}: {e}")


async def _run_form_checks(page, url, idx, issues):
    forms = page.locator("form")
    for i in range(min(await forms.count(), 3)):
        form = forms.nth(i)
        try:
            if not await form.is_visible():
                continue

            await _check_required_field_validation(page, form, url, idx, issues)
            await _check_email_validation(page, form, url, idx, issues)
            await _check_password_validation(page, form, url, idx, issues)
            await _check_missing_form_labels(page, form, url, idx, issues)
            await _check_insecure_form_submission(page, form, url, idx, issues)
        except Exception as e:
            print(f"[playwright] _run_form_checks error on form {i} at {url}: {e}")


async def _trigger_popups(page):
    try:
        await page.wait_for_timeout(3000)
        await page.mouse.wheel(0, 1000)
        await page.wait_for_timeout(1500)
    except Exception as e:
        print(f"[playwright] _trigger_popups error: {e}")


async def _scan_popup_forms(page, url, idx, issues):
    selectors = ["[role='dialog']", ".modal", ".popup", ".overlay"]

    for sel in selectors:
        container = page.locator(sel)
        for ci in range(min(await container.count(), 2)):
            popup = container.nth(ci)
            forms = popup.locator("form")
            for fi in range(min(await forms.count(), 2)):
                try:
                    form = forms.nth(fi)
                    if await form.is_visible():
                        await _check_required_field_validation(
                            page, form, url, idx, issues
                        )
                        await _check_email_validation(page, form, url, idx, issues)
                        await _check_password_validation(page, form, url, idx, issues)
                        await _check_missing_form_labels(page, form, url, idx, issues)
                        await _check_insecure_form_submission(
                            page, form, url, idx, issues
                        )
                except Exception as e:
                    print(
                        f"[playwright] _scan_popup_forms error on {sel} at {url}: {e}"
                    )


async def _check_broken_images(page, url, idx, issues):
    """Flag images that failed to load (naturalWidth == 0)."""
    try:
        broken_srcs = await page.locator("img").evaluate_all(
            "els => els.filter(el => !el.naturalWidth).map(el => el.src)"
        )
        broken_srcs = [s for s in broken_srcs if s and not s.startswith("data:")]

        if broken_srcs:
            path = get_screenshot_path("broken_images", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Broken Images",
                    severity="High",
                    description=f"{len(broken_srcs)} broken image(s) detected.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_broken_images error on {url}: {e}")


async def _check_missing_alt_text(page, url, idx, issues):
    """Flag <img> elements with no alt attribute or empty one on non-decorative images."""
    try:
        count = await page.locator("img:not([alt]), img[alt='']").count()

        if count > 0:
            path = get_screenshot_path("missing_alt", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Missing Alt Text",
                    severity="Medium",
                    description=f"{count} image(s) missing alt text.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_missing_alt_text error on {url}: {e}")


async def _check_page_title(page, url, issues):
    """Flag pages with no <title> or a blank one."""
    try:
        title = await page.title()
        if not title or not title.strip():
            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Missing Page Title",
                    severity="Medium",
                    description="Page has no <title> tag.",
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_page_title error on {url}: {e}")


async def _check_meta_description(page, url, issues):
    """Flag pages missing a meta description."""
    try:
        count = await page.locator("meta[name='description'][content]").count()
        if count == 0:
            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Missing Meta Description",
                    severity="Low",
                    description="Page has no meta description tag.",
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_meta_description error on {url}: {e}")


async def _check_console_errors(page, url, idx, issues, console_errors: list):
    """
    Report JS errors collected by the console listener that was attached
    before page.goto() so errors from the very first frame are captured.
    """
    try:
        if console_errors:
            path = get_screenshot_path("console_errors", idx)
            await page.screenshot(path=path, full_page=True)

            messages = list(dict.fromkeys(console_errors))
            preview = "; ".join(messages[:3])
            if len(messages) > 3:
                preview += f"; and {len(messages) - 3} more"

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Console JavaScript Error",
                    severity="High",
                    description=(
                        f"{len(messages)} unique JS error(s) detected: {preview}"
                    ),
                    screenshot=path,
                    evidence={"console_messages": messages},
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_console_errors error on {url}: {e}")


async def _check_empty_buttons(page, url, idx, issues):
    """Flag buttons with no accessible label — invisible to screen readers."""
    try:
        count = await page.locator("button").evaluate_all(
            """
            els => els.filter(el =>
                !el.textContent.trim() &&
                !el.getAttribute("aria-label") &&
                !el.getAttribute("title")
            ).length
        """
        )
        if count > 0:
            path = get_screenshot_path("empty_buttons", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Empty Buttons",
                    severity="Medium",
                    description=f"{count} button(s) have no accessible label.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_empty_buttons error on {url}: {e}")


async def _check_empty_links(page, url, idx, issues):
    """Flag <a> tags with no text or aria-label — broken for keyboard/screen reader users."""
    try:
        count = await page.locator("a").evaluate_all(
            """
            els => els.filter(el =>
                !el.textContent.trim() &&
                !el.getAttribute("aria-label") &&
                !el.querySelector("img[alt]")
            ).length
        """
        )
        if count > 0:
            path = get_screenshot_path("empty_links", idx)
            await page.screenshot(path=path, full_page=True)

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Empty Links",
                    severity="Medium",
                    description=f"{count} link(s) have no accessible label.",
                    screenshot=path,
                ).model_dump()
            )
    except Exception as e:
        print(f"[playwright] _check_empty_links error on {url}: {e}")


async def _run_page_checks(page, url, idx, issues, console_errors: list):
    """Run all page-level (non-form) checks."""
    await _check_broken_images(page, url, idx, issues)
    await _check_missing_alt_text(page, url, idx, issues)
    await _check_page_title(page, url, issues)
    await _check_meta_description(page, url, issues)
    await _check_console_errors(page, url, idx, issues, console_errors)
    await _check_empty_buttons(page, url, idx, issues)
    await _check_empty_links(page, url, idx, issues)


async def _scan_page(context, url: str, idx: int) -> PageScanResult:
    """
    Scan a single page and return its issues as an independent list.
    Each page owns its own list — no shared mutable state across concurrent scans.
    """
    result = PageScanResult(url=url)
    started_at = time.monotonic()
    page = await context.new_page()

    console_errors: list[str] = []
    page.on(
        "console",
        lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
    )
    page.on("pageerror", lambda error: console_errors.append(str(error)))

    try:
        res = await page.goto(url, wait_until="load", timeout=15000)
        result.http_status = res.status if res else None
        await page.wait_for_timeout(1500)
        result.title = await page.title()

        if res and res.status >= 400:
            result.issues.append(
                IssueModel(
                    page=url,
                    issue_type="Broken Page",
                    severity="High",
                    description=f"HTTP {res.status}",
                ).model_dump()
            )

        await _run_page_checks(page, url, idx, result.issues, console_errors)

        await _trigger_popups(page)
        await _scan_popup_forms(page, url, idx, result.issues)

        await _run_form_checks(page, url, idx, result.issues)

    except PlaywrightTimeoutError:
        result.timed_out = True
        result.error = "Page load timeout"
        result.issues.append(
            IssueModel(
                page=url,
                issue_type="Page Load Failure",
                severity="High",
                description="Timeout",
            ).model_dump()
        )

    except Exception as e:
        result.error = str(e)
        print(f"[playwright] Unexpected error on {url}: {e}")

    finally:
        result.duration_ms = round((time.monotonic() - started_at) * 1000)
        await page.close()

    return result


def _check_duplicate_titles(page_titles: dict[str, str]) -> list[dict]:
    """
    Post-processing pass over all collected page titles.
    Returns one issue per group of pages that share the same non-empty title.
    Runs after all pages are scanned so it has the full picture.
    """
    from collections import defaultdict

    title_to_pages: dict[str, list[str]] = defaultdict(list)
    for url, title in page_titles.items():
        if title and title.strip():
            title_to_pages[title.strip()].append(url)

    dup_issues = []
    for title, urls in title_to_pages.items():
        if len(urls) > 1:
            dup_issues.append(
                IssueModel(
                    page=urls[0],
                    issue_type="Duplicate Page Title",
                    severity="Medium",
                    description=(
                        f'{len(urls)} pages share the title "{title}": '
                        + ", ".join(urls[1:])
                    ),
                ).model_dump()
            )
    return dup_issues


async def _scan_pages_with_timeout(
    context, pages: list[str], timeout: float | None = None
) -> list[PageScanResult]:
    """Scan pages concurrently while retaining every result completed on time."""
    if timeout is None:
        timeout = get_settings().scan_timeout_seconds
    tasks = [
        asyncio.create_task(_scan_page(context, url, idx))
        for idx, url in enumerate(pages)
    ]
    done, pending = await asyncio.wait(tasks, timeout=timeout)
    results_by_index: dict[int, PageScanResult] = {}

    for idx, task in enumerate(tasks):
        if task not in done:
            continue

        try:
            results_by_index[idx] = task.result()
        except Exception as exc:
            results_by_index[idx] = PageScanResult(
                url=pages[idx],
                error=str(exc),
                issues=[
                    IssueModel(
                        page=pages[idx],
                        issue_type="Page Scan Failure",
                        severity="High",
                        description=f"Page scan failed: {exc}",
                    ).model_dump()
                ],
            )

    for task in pending:
        task.cancel()
    if pending:
        await asyncio.gather(*pending, return_exceptions=True)

    for idx, task in enumerate(tasks):
        if task in pending:
            results_by_index[idx] = PageScanResult(
                url=pages[idx],
                timed_out=True,
                error="Global scan timeout",
                issues=[
                    IssueModel(
                        page=pages[idx],
                        issue_type="Page Load Failure",
                        severity="High",
                        description="Global scan timeout",
                    ).model_dump()
                ],
            )

    return [results_by_index[idx] for idx in range(len(pages))]


async def _test(start_url: str):
    settings = get_settings()
    scan_started_at = datetime.now(timezone.utc).isoformat()
    scan_start_time = time.monotonic()

    pages = await _crawl(start_url)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=settings.headless)
        context = await browser.new_context()

        try:
            page_results = await _scan_pages_with_timeout(
                context, pages, settings.scan_timeout_seconds
            )
        finally:
            await browser.close()

    issues = [issue for result in page_results for issue in result.issues]
    page_titles = {result.url: result.title for result in page_results}
    issues += _check_duplicate_titles(page_titles)

    scan_duration = round(time.monotonic() - scan_start_time, 2)

    return {
        "url": start_url,
        "pages_scanned": len(pages),
        "pages": [result.as_dict() for result in page_results],
        "issues": issues,
        "scanned_at": scan_started_at,
        "scan_duration_seconds": scan_duration,
        "errors": [],
    }


async def test_website(start_url: str):
    return await _test(start_url)
