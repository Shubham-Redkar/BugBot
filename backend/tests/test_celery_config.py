from celery_app import celery_app
from tasks import scan_tasks  # noqa: F401 - registers scan task


def test_celery_uses_durable_scan_queue_settings():
    assert celery_app.conf.task_serializer == "json"
    assert celery_app.conf.task_ignore_result is True
    assert celery_app.conf.task_acks_late is True
    assert celery_app.conf.task_reject_on_worker_lost is True
    assert celery_app.conf.worker_prefetch_multiplier == 1
    assert celery_app.conf.task_routes["bugbot.scan.execute"]["queue"] == "scans"
    assert "bugbot.scan.execute" in celery_app.tasks
