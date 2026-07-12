import pytest
from fastapi import BackgroundTasks, HTTPException

from api import routes
from models.request_models import ScanRequest


@pytest.mark.asyncio
async def test_scan_route_returns_client_error_for_unsafe_target():
    with pytest.raises(HTTPException) as error:
        await routes.scan_website(
            ScanRequest(url="http://127.0.0.1"),
            background_tasks=BackgroundTasks(),
            session=object(),
        )

    assert error.value.status_code == 400
    assert "non-public" in error.value.detail


@pytest.mark.asyncio
async def test_scan_route_creates_pending_job_and_schedules_work(monkeypatch):
    from uuid import uuid4

    scan_id = uuid4()
    validated = []

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
    background_tasks = BackgroundTasks()

    response = await routes.scan_website(
        ScanRequest(url="https://example.com"),
        background_tasks=background_tasks,
        session=object(),
    )

    assert response == {
        "scan_id": str(scan_id),
        "status": "pending",
        "poll_url": f"/results/{scan_id}",
    }
    assert validated == ["https://example.com/"]
    assert len(background_tasks.tasks) == 1


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
