from celery import Celery

from config import get_settings


settings = get_settings()
celery_app = Celery(
    "bugbot",
    broker=settings.celery_broker_url,
    include=["tasks.scan_tasks"],
)
celery_app.conf.update(
    accept_content=["json"],
    task_serializer="json",
    result_serializer="json",
    task_ignore_result=True,
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    broker_transport_options={
        "visibility_timeout": settings.celery_visibility_timeout_seconds
    },
    task_soft_time_limit=settings.celery_task_soft_time_limit_seconds,
    task_time_limit=settings.celery_task_time_limit_seconds,
    task_always_eager=settings.celery_task_always_eager,
    timezone="UTC",
    enable_utc=True,
    task_routes={"bugbot.scan.execute": {"queue": "scans"}},
)
