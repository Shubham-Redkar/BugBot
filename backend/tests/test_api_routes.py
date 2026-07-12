import pytest
from fastapi import HTTPException

from api import routes
from models.request_models import ScanRequest
from services.url_security import UnsafeUrlError


@pytest.mark.asyncio
async def test_scan_route_returns_client_error_for_unsafe_target(monkeypatch):
    async def blocked_scan(_url):
        raise UnsafeUrlError("Private and non-public network targets are not allowed")

    monkeypatch.setattr(routes, "run_scan", blocked_scan)

    with pytest.raises(HTTPException) as error:
        await routes.scan_website(
            ScanRequest(url="http://127.0.0.1"),
            session=object(),
        )

    assert error.value.status_code == 400
    assert "non-public" in error.value.detail
