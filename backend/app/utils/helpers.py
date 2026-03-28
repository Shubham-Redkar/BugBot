from urllib.parse import urlparse, urljoin

def normalize_url(base_url: str, href: str):
    return urljoin(base_url, href)

def is_internal_link(base_url: str, target_url: str):
    return urlparse(base_url).netloc == urlparse(target_url).netloc

def clean_links(base_url: str, links: list):
    seen = set()
    cleaned = []

    for link in links:
        if not link:
            continue

        if link.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue

        full_url = normalize_url(base_url, link)

        if is_internal_link(base_url, full_url) and full_url not in seen:
            seen.add(full_url)
            cleaned.append(full_url)

    return cleaned
