from uuid import uuid4

import pytest

from services import scan_jobs


class FakeSession:
    rolled_back = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def rollback(self):
        self.rolled_back = True


class FakeRepository:
    def __init__(self):
        self.events = []

    async def mark_running(self, scan_id):
        self.events.append(("running", scan_id))

    async def replace_with_result(self, result):
        self.events.append(("completed", result["scan_id"]))

    async def mark_failed(self, scan_id, message):
        self.events.append(("failed", scan_id, message))


@pytest.mark.asyncio
async def test_background_job_transitions_to_completed(monkeypatch):
    scan_id = uuid4()
    session = FakeSession()
    repository = FakeRepository()

    async def completed_scan(_url, scan_id):
        return {"scan_id": str(scan_id)}

    monkeypatch.setattr(scan_jobs, "get_session_factory", lambda: lambda: session)
    monkeypatch.setattr(scan_jobs, "ScanRepository", lambda _session: repository)
    monkeypatch.setattr(scan_jobs, "run_scan", completed_scan)

    await scan_jobs.execute_scan_job(scan_id, "https://example.com")

    assert repository.events == [
        ("running", scan_id),
        ("completed", str(scan_id)),
    ]
    assert session.rolled_back is False


@pytest.mark.asyncio
async def test_background_job_persists_failed_state(monkeypatch):
    scan_id = uuid4()
    session = FakeSession()
    repository = FakeRepository()

    async def failed_scan(_url, scan_id):
        raise RuntimeError("browser failed")

    monkeypatch.setattr(scan_jobs, "get_session_factory", lambda: lambda: session)
    monkeypatch.setattr(scan_jobs, "ScanRepository", lambda _session: repository)
    monkeypatch.setattr(scan_jobs, "run_scan", failed_scan)

    await scan_jobs.execute_scan_job(scan_id, "https://example.com")

    assert repository.events == [
        ("running", scan_id),
        ("failed", scan_id, "The scan job failed."),
    ]
    assert session.rolled_back is True
