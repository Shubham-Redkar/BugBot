import re
import asyncio
import concurrent.futures
from urllib.parse import urljoin
from playwright.async_api import (
    async_playwright,
    TimeoutError as PlaywrightTimeoutError,
)
from utils.helpers import clean_links
from services.screenshot_service import get_screenshot_path
from models.response_models import ScanResultModel, IssueModel
from utils.constants import MAX_PAGES, HEADLESS

# Maximum total seconds the entire scan (all pages) may run before being aborted.
SCAN_TIMEOUT_SECONDS = 120

# NOTE: ScanResultModel in response_models.py must include these two new fields:
#   scanned_at: str = ""              (ISO 8601 UTC timestamp)
#   scan_duration_seconds: float = 0.0 (total wall-clock seconds for the scan)


# =========================================================
# CRAWL
# =========================================================


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

    return [start_url] + discovered[: MAX_PAGES - 1]


# =========================================================
# HELPERS
# =========================================================


def deduplicate_issues(issues: list[dict]) -> list[dict]:
    seen = set()
    unique = []

    for issue in issues:
        key = (issue.get("page"), issue.get("issue_type"))
        if key not in seen:
            seen.add(key)
            unique.append(issue)

    return unique


def extract_count(description: str) -> int:
    match = re.search(r"(\d+)", description or "")
    return int(match.group(1)) if match else 1


def calculate_health_score(issues: list[dict], pages_scanned: int):
    summary = {"high": 0, "medium": 0, "low": 0}
    total_penalty = 0

    # Expanded priority sets to cover all check types
    high_priority = {
        "Required Field Validation",
        "Email Validation Check",
        "Insecure Form Submission",
        "Broken Images",
        "Console JavaScript Error",
        "Broken Page",
        "Page Load Failure",
    }

    medium_priority = {
        "Password Validation Check",
        "Missing Form Labels",
        "Missing Alt Text",
        "Missing Page Title",
        "Empty Buttons",
        "Empty Links",
    }

    for issue in issues:
        severity = issue.get("severity", "").lower()
        issue_type = issue.get("issue_type", "")
        count = extract_count(issue.get("description", ""))

        count_factor = min(count, 10)
        high_bonus = 2 if issue_type in high_priority else 0
        medium_bonus = 1 if issue_type in medium_priority else 0

        if severity == "high":
            summary["high"] += 1
            total_penalty += 12 + count_factor + high_bonus
        elif severity == "medium":
            summary["medium"] += 1
            total_penalty += 5 + (count_factor * 0.5) + medium_bonus
        else:
            summary["low"] += 1
            total_penalty += 2 + (count_factor * 0.2)

    score = int(max(0, 100 - (total_penalty / max(pages_scanned, 1))))

    status = (
        "Excellent"
        if score >= 90
        else "Good" if score >= 75 else "Fair" if score >= 55 else "Poor"
    )

    return score, summary, status


# =========================================================
# FORM VALIDATION
# =========================================================


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


# =========================================================
# POPUP HANDLING
# =========================================================


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


# =========================================================
# PAGE-LEVEL CHECKS (NEW)
# =========================================================


async def _check_broken_images(page, url, idx, issues):
    """Flag images that failed to load (naturalWidth == 0)."""
    try:
        broken_srcs = await page.locator("img").evaluate_all(
            "els => els.filter(el => !el.naturalWidth).map(el => el.src)"
        )
        # Filter out empty src / data URIs which are intentional
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

            issues.append(
                IssueModel(
                    page=url,
                    issue_type="Console JavaScript Error",
                    severity="High",
                    description=f"{len(console_errors)} JS console error(s) detected.",
                    screenshot=path,
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


# =========================================================
# SINGLE PAGE SCAN
# =========================================================


async def _scan_page(context, url: str, idx: int) -> list[dict]:
    """
    Scan a single page and return its issues as an independent list.
    Each page owns its own list — no shared mutable state across concurrent scans.
    """
    page_issues: list[dict] = []
    page = await context.new_page()

    # Attach console listener before navigation so errors from the
    # very first frame load are captured.
    console_errors = []
    page.on(
        "console",
        lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
    )

    try:
        res = await page.goto(url, wait_until="load", timeout=15000)
        await page.wait_for_timeout(1500)

        if res and res.status >= 400:
            page_issues.append(
                IssueModel(
                    page=url,
                    issue_type="Broken Page",
                    severity="High",
                    description=f"HTTP {res.status}",
                ).model_dump()
            )
            # Still run checks — page may have partial content worth inspecting

        # Page-level checks
        await _run_page_checks(page, url, idx, page_issues, console_errors)

        # Popup detection
        await _trigger_popups(page)
        await _scan_popup_forms(page, url, idx, page_issues)

        # Form checks
        await _run_form_checks(page, url, idx, page_issues)

    except PlaywrightTimeoutError:
        page_issues.append(
            IssueModel(
                page=url,
                issue_type="Page Load Failure",
                severity="High",
                description="Timeout",
            ).model_dump()
        )

    except Exception as e:
        print(f"[playwright] Unexpected error on {url}: {e}")

    finally:
        await page.close()

    return page_issues


# =========================================================
# MAIN TEST
# =========================================================


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
                    page=urls[0],  # anchor to the first occurrence
                    issue_type="Duplicate Page Title",
                    severity="Medium",
                    description=(
                        f'{len(urls)} pages share the title "{title}": '
                        + ", ".join(urls[1:])
                    ),
                ).model_dump()
            )
    return dup_issues


async def _test(start_url: str):
    import time
    from datetime import datetime, timezone

    scan_started_at = datetime.now(timezone.utc).isoformat()
    scan_start_time = time.monotonic()

    pages = await _crawl(start_url)

    # Collect page titles during scan for duplicate detection
    page_titles: dict[str, str] = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context()

        try:
            # Each page returns its own independent issue list — no shared state.
            # asyncio.gather runs all pages concurrently for speed.
            results: list[list[dict]] = await asyncio.wait_for(
                asyncio.gather(
                    *[_scan_page(context, url, idx) for idx, url in enumerate(pages)]
                ),
                timeout=SCAN_TIMEOUT_SECONDS,
            )

            # Collect titles for duplicate detection while merging issues
            for url, page_issues in zip(pages, results):
                title_issues = [
                    i
                    for i in page_issues
                    if i.get("issue_type") == "Missing Page Title"
                ]
                # If no "Missing Page Title" issue, the page has a title — fetch it
                # from the description absence; store empty string to skip dup check
                page_titles[url] = "" if title_issues else url  # placeholder, see below

        except asyncio.TimeoutError:
            print(
                f"[playwright] Global scan timeout ({SCAN_TIMEOUT_SECONDS}s) "
                f"reached for {start_url} — returning partial results."
            )
            results = [[] for _ in pages]

        finally:
            await browser.close()

    # Flatten per-page issue lists into one
    issues: list[dict] = [issue for page_issues in results for issue in page_issues]

    # Duplicate title detection — needs a second lightweight browser pass
    # only if there are 2+ pages worth checking (single-page sites skip this)
    if len(pages) > 1:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=HEADLESS)
            page = await browser.new_page()
            for url in pages:
                try:
                    await page.goto(url, wait_until="load", timeout=10000)
                    page_titles[url] = await page.title()
                except Exception:
                    page_titles[url] = ""
            await browser.close()

        issues += _check_duplicate_titles(page_titles)

    scan_duration = round(time.monotonic() - scan_start_time, 2)

    issues = deduplicate_issues(issues)
    score, summary, status = calculate_health_score(issues, len(pages))

    return ScanResultModel(
        url=start_url,
        pages_scanned=len(pages),
        issues_found=len(issues),
        health_score=score,
        health_status=status,
        summary=summary,
        issues=issues,
        scanned_at=scan_started_at,
        scan_duration_seconds=scan_duration,
    ).model_dump()


# =========================================================
# THREAD WRAPPER
# =========================================================


def _run_in_thread(coro_fn):
    def run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro_fn())
        finally:
            loop.close()

    with concurrent.futures.ThreadPoolExecutor() as pool:
        return pool.submit(run).result()


async def test_website(start_url: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_in_thread, lambda: _test(start_url))
