import asyncio
from uuid import UUID

from celery_app import celery_app
from db.postgres import close_postgres
from services.llm_service import close_llm_client
from services.scan_jobs import execute_scan_job


async def run_worker_job(scan_id: UUID, target_url: str) -> None:
    try:
        await execute_scan_job(scan_id, target_url)
    finally:
        # Celery invokes this through asyncio.run; dispose loop-bound resources
        # before that event loop closes so the next task starts cleanly.
        await close_llm_client()
        await close_postgres()


@celery_app.task(
    name="bugbot.scan.execute",
    acks_late=True,
    reject_on_worker_lost=True,
    ignore_result=True,
)
def execute_scan_task(scan_id: str, target_url: str) -> None:
    asyncio.run(run_worker_job(UUID(scan_id), target_url))


def dispatch_scan_job(scan_id: UUID, target_url: str) -> None:
    execute_scan_task.apply_async(
        args=[str(scan_id), target_url],
        task_id=str(scan_id),
        queue="scans",
    )
