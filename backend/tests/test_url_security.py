import pytest

from services.url_security import UnsafeUrlError, UrlSafetyValidator, is_public_address


def resolver_for(*addresses: str):
    calls = 0

    async def resolve(_hostname: str) -> set[str]:
        nonlocal calls
        calls += 1
        return set(addresses)

    resolve.call_count = lambda: calls
    return resolve


@pytest.mark.parametrize(
    "url",
    [
        "file:///etc/passwd",
        "ftp://example.com/file",
        "http://localhost/admin",
        "http://service.internal/admin",
        "http://user:password@example.com",
        "http://127.0.0.1",
        "http://169.254.169.254/latest/meta-data",
        "http://[::1]",
    ],
)
@pytest.mark.asyncio
async def test_validator_rejects_unsafe_urls_without_dns(url):
    validator = UrlSafetyValidator(resolver_for("1.1.1.1"))

    with pytest.raises(UnsafeUrlError):
        await validator.validate(url)


@pytest.mark.asyncio
async def test_validator_allows_public_http_and_https_targets():
    validator = UrlSafetyValidator(resolver_for("1.1.1.1", "2606:4700:4700::1111"))

    assert await validator.validate("https://example.com/path") == (
        "https://example.com/path"
    )
    assert await validator.validate("http://example.com/other") == (
        "http://example.com/other"
    )


@pytest.mark.asyncio
async def test_any_private_dns_answer_blocks_target():
    validator = UrlSafetyValidator(resolver_for("1.1.1.1", "10.0.0.5"))

    with pytest.raises(UnsafeUrlError, match="non-public"):
        await validator.validate("https://example.com")


@pytest.mark.asyncio
async def test_dns_results_are_cached_per_hostname():
    resolver = resolver_for("1.1.1.1")
    validator = UrlSafetyValidator(resolver)

    await validator.validate("https://example.com/one")
    await validator.validate("https://example.com/two")

    assert resolver.call_count() == 1


def test_address_classification_is_fail_closed():
    assert is_public_address("1.1.1.1")
    assert not is_public_address("10.0.0.1")
    assert not is_public_address("not-an-address")


class FakeRoute:
    def __init__(self):
        self.action = None

    async def abort(self, reason):
        self.action = ("abort", reason)

    async def continue_(self):
        self.action = ("continue", None)


class FakeRequest:
    def __init__(self, url):
        self.url = url


@pytest.mark.asyncio
async def test_request_guard_aborts_private_subresources():
    validator = UrlSafetyValidator(resolver_for("10.0.0.8"))
    route = FakeRoute()

    await validator.guard_route(route, FakeRequest("http://internal.example/data"))

    assert route.action == ("abort", "blockedbyclient")


@pytest.mark.asyncio
async def test_request_guard_continues_public_subresources():
    validator = UrlSafetyValidator(resolver_for("1.1.1.1"))
    route = FakeRoute()

    await validator.guard_route(route, FakeRequest("https://cdn.example.com/app.js"))

    assert route.action == ("continue", None)
