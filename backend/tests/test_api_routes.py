import pytest
from fastapi import HTTPException

from api import routes
from models.request_models import ScanRequest


@pytest.mark.asyncio
async def test_scan_route_returns_client_error_for_unsafe_target():
    with pytest.raises(HTTPException) as error:
        await routes.scan_website(
            ScanRequest(url="http://127.0.0.1"),
            session=object(),
        )

    assert error.value.status_code == 400
    assert "non-public" in error.value.detail


@pytest.mark.asyncio
async def test_scan_route_creates_pending_job_and_schedules_work(monkeypatch):
    from uuid import uuid4

    scan_id = uuid4()
    validated = []
    dispatched = []

    class FakeValidator:
        async def validate(self, url):
            validated.append(url)

    class FakeRepository:
        def __init__(self, _session):
            pass

        async def create_pending(self, _url):
            return scan_id

    monkeypatch.setattr(routes, "UrlSafetyValidator", FakeValidator)
    monkeypatch.setattr(routes, "ScanRepository", FakeRepository)
    monkeypatch.setattr(
        routes,
        "dispatch_scan_job",
        lambda queued_id, url: dispatched.append((queued_id, url)),
    )

    response = await routes.scan_website(
        ScanRequest(url="https://example.com"),
        session=object(),
    )

    assert response == {
        "scan_id": str(scan_id),
        "status": "pending",
        "poll_url": f"/results/{scan_id}",
    }
    assert validated == ["https://example.com/"]
    assert dispatched == [(scan_id, "https://example.com/")]


def test_openapi_uses_typed_success_responses():
    from main import app

    schema = app.openapi()
    create_response = schema["paths"]["/scan"]["post"]["responses"]["202"]
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


@pytest.mark.asyncio
async def test_scan_route_marks_job_failed_when_broker_is_unavailable(monkeypatch):
    from uuid import uuid4

    scan_id = uuid4()
    failures = []

    class FakeValidator:
        async def validate(self, _url):
            return None

    class FakeRepository:
        def __init__(self, _session):
            pass

        async def create_pending(self, _url):
            return scan_id

        async def mark_failed(self, failed_id, message):
            failures.append((failed_id, message))

    def unavailable_broker(*_args):
        raise routes.BrokerOperationalError("Redis unavailable")

    monkeypatch.setattr(routes, "UrlSafetyValidator", FakeValidator)
    monkeypatch.setattr(routes, "ScanRepository", FakeRepository)
    monkeypatch.setattr(routes, "dispatch_scan_job", unavailable_broker)

    with pytest.raises(HTTPException) as error:
        await routes.scan_website(
            ScanRequest(url="https://example.com"),
            session=object(),
        )

    assert error.value.status_code == 503
    assert failures == [(scan_id, "The scan could not be queued.")]
