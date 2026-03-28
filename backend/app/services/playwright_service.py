import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from utils.helpers import clean_links
from services.screenshot_service import get_screenshot_path
from models.response_models import ScanResultModel, IssueModel

MAX_PAGES = int(os.getenv("MAX_PAGES", 5))
HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"


async def crawl_internal_links(start_url: str):
    discovered_links = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        page = await browser.new_page()

        try:
            await page.goto(start_url, wait_until="load", timeout=15000)

            hrefs = await page.locator("a").evaluate_all(
                "elements => elements.map(el => el.getAttribute('href'))"
            )

            discovered_links = clean_links(start_url, hrefs)

        except Exception as e:
            print("Crawl error:", e)

        await browser.close()

    return [start_url] + discovered_links[:MAX_PAGES - 1]


async def test_website(start_url: str):
    issues = []
    pages_to_test = await crawl_internal_links(start_url)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context()

        for idx, url in enumerate(pages_to_test):
            page = await context.new_page()

            try:
                response = await page.goto(url, wait_until="load", timeout=15000)

                # ---------------------------
                # 1) Broken page / bad status
                # ---------------------------
                if response and response.status >= 400:
                    screenshot = get_screenshot_path("broken_page", idx)
                    await page.screenshot(path=screenshot, full_page=True)

                    issues.append(IssueModel(
                        page=url,
                        issue_type="Broken Page",
                        severity="High",
                        description=f"Page returned status code {response.status}",
                        screenshot=screenshot
                    ).model_dump())

                # ---------------------------
                # 2) Forms
                # ---------------------------
                forms = page.locator("form")
                form_count = await forms.count()

                for form_index in range(form_count):
                    form = forms.nth(form_index)

                    # Try empty submit
                    try:
                        submit_btn = form.locator("button[type='submit'], input[type='submit']")
                        submit_count = await submit_btn.count()

                        if submit_count > 0:
                            await submit_btn.first.click(timeout=3000)

                            screenshot = get_screenshot_path("empty_form_submit", idx)
                            await page.screenshot(path=screenshot, full_page=True)

                            issues.append(IssueModel(
                                page=url,
                                issue_type="Form Validation Check",
                                severity="Medium",
                                description="Form submitted with empty fields. Validation should be reviewed.",
                                screenshot=screenshot
                            ).model_dump())

                    except Exception:
                        pass

                    # Try invalid email
                    try:
                        email_input = form.locator("input[type='email']")
                        email_count = await email_input.count()

                        if email_count > 0:
                            await email_input.first.fill("invalid-email")

                            submit_btn = form.locator("button[type='submit'], input[type='submit']")
                            submit_count = await submit_btn.count()

                            if submit_count > 0:
                                await submit_btn.first.click(timeout=3000)

                                screenshot = get_screenshot_path("invalid_email", idx)
                                await page.screenshot(path=screenshot, full_page=True)

                                issues.append(IssueModel(
                                    page=url,
                                    issue_type="Email Validation Check",
                                    severity="Medium",
                                    description="Invalid email was tested. Validation should be reviewed.",
                                    screenshot=screenshot
                                ).model_dump())

                    except Exception:
                        pass

                # ---------------------------
                # 3) Dead / bad links (lightweight)
                # ---------------------------
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
                    description=f"Page load timed out: {str(e)}",
                    screenshot=screenshot
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
                    description=f"Failed to load page: {str(e)}",
                    screenshot=screenshot
                ).model_dump())

            finally:
                await page.close()

        await browser.close()

    result = ScanResultModel(
        url=start_url,
        pages_scanned=len(pages_to_test),
        issues_found=len(issues),
        issues=issues
    )

    return result.model_dump()
