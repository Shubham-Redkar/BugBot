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


def test_openapi_uses_typed_success_responses():
    from main import app

    schema = app.openapi()
    create_response = schema["paths"]["/scan"]["post"]["responses"]["201"]
    result_response = schema["paths"]["/results/{scan_id}"]["get"]["responses"]["200"]
    health_response = schema["paths"]["/"]["get"]["responses"]["200"]

    assert create_response["content"]["application/json"]["schema"]["$ref"].endswith(
        "/CreateScanResponse"
    )
    assert result_response["content"]["application/json"]["schema"]["$ref"].endswith(
        "/ScanResultResponse"
    )
    assert health_response["content"]["application/json"]["schema"]["$ref"].endswith(
        "/HealthResponse"
    )
