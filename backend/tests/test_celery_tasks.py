from uuid import uuid4

import pytest

from tasks import scan_tasks


def test_dispatch_uses_scan_id_as_celery_task_id(monkeypatch):
    scan_id = uuid4()
    calls = []

    monkeypatch.setattr(
        scan_tasks.execute_scan_task,
        "apply_async",
        lambda **kwargs: calls.append(kwargs),
    )

    scan_tasks.dispatch_scan_job(scan_id, "https://example.com")

    assert calls == [
        {
            "args": [str(scan_id), "https://example.com"],
            "task_id": str(scan_id),
            "queue": "scans",
        }
    ]


@pytest.mark.asyncio
async def test_worker_job_closes_loop_bound_resources(monkeypatch):
    scan_id = uuid4()
    events = []

    async def execute(_scan_id, _url):
        events.append("execute")

    async def close_llm():
        events.append("close_llm")

    async def close_database():
        events.append("close_database")

    monkeypatch.setattr(scan_tasks, "execute_scan_job", execute)
    monkeypatch.setattr(scan_tasks, "close_llm_client", close_llm)
    monkeypatch.setattr(scan_tasks, "close_postgres", close_database)

    await scan_tasks.run_worker_job(scan_id, "https://example.com")

    assert events == ["execute", "close_llm", "close_database"]
