from utils.helpers import clean_links, is_internal_link, normalize_url


def test_normalize_url_resolves_relative_path():
    assert (
        normalize_url("https://example.com/docs/", "../about")
        == "https://example.com/about"
    )


def test_internal_link_requires_matching_network_location():
    assert is_internal_link("https://example.com", "https://example.com/about")
    assert not is_internal_link("https://example.com", "https://other.example/about")


def test_clean_links_filters_unsupported_external_and_duplicate_links():
    links = [
        "/about",
        "https://example.com/about",
        "mailto:hello@example.com",
        "tel:+123456789",
        "javascript:void(0)",
        "#content",
        "https://other.example/page",
        None,
    ]

    assert clean_links("https://example.com", links) == [
        "https://example.com/about"
    ]
