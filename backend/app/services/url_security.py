import asyncio
import ipaddress
import socket
from collections.abc import Awaitable, Callable
from urllib.parse import urlsplit


AddressResolver = Callable[[str], Awaitable[set[str]]]
ALLOWED_SCHEMES = {"http", "https"}
BLOCKED_HOSTNAMES = {"localhost", "localhost.localdomain"}
BLOCKED_HOST_SUFFIXES = (".localhost", ".local", ".internal")


class UnsafeUrlError(ValueError):
    """Raised when a URL could reach a non-public network destination."""


async def resolve_addresses(hostname: str) -> set[str]:
    loop = asyncio.get_running_loop()
    try:
        records = await loop.getaddrinfo(
            hostname,
            None,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise UnsafeUrlError("The target hostname could not be resolved") from exc
    return {record[4][0].split("%", 1)[0] for record in records}


def is_public_address(value: str) -> bool:
    try:
        return ipaddress.ip_address(value).is_global
    except ValueError:
        return False


class UrlSafetyValidator:
    def __init__(self, resolver: AddressResolver = resolve_addresses):
        self._resolver = resolver
        self._address_cache: dict[str, set[str]] = {}

    async def validate(self, url: str) -> str:
        parsed = urlsplit(url)
        scheme = parsed.scheme.lower()
        if scheme not in ALLOWED_SCHEMES:
            raise UnsafeUrlError("Only HTTP and HTTPS targets are allowed")
        if parsed.username or parsed.password:
            raise UnsafeUrlError("Target URLs must not contain credentials")

        hostname = (parsed.hostname or "").lower().rstrip(".")
        if not hostname:
            raise UnsafeUrlError("The target URL must include a hostname")
        if hostname in BLOCKED_HOSTNAMES or hostname.endswith(BLOCKED_HOST_SUFFIXES):
            raise UnsafeUrlError("Local and internal hostnames are not allowed")

        try:
            addresses = {str(ipaddress.ip_address(hostname))}
        except ValueError:
            addresses = await self._resolve(hostname)

        if not addresses:
            raise UnsafeUrlError("The target hostname did not resolve to an address")
        if any(not is_public_address(address) for address in addresses):
            raise UnsafeUrlError("Private and non-public network targets are not allowed")
        return url

    async def _resolve(self, hostname: str) -> set[str]:
        if hostname not in self._address_cache:
            self._address_cache[hostname] = await self._resolver(hostname)
        return self._address_cache[hostname]

    async def guard_route(self, route, request) -> None:
        try:
            await self.validate(request.url)
        except UnsafeUrlError:
            await route.abort("blockedbyclient")
            return
        await route.continue_()
