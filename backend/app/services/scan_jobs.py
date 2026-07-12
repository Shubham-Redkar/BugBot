import logging
from uuid import UUID

from agents.scan_coordinator import run_scan
from db.postgres import get_session_factory
from repositories.scan_repository import ScanRepository


logger = logging.getLogger(__name__)


async def execute_scan_job(scan_id: UUID, target_url: str) -> None:
    """Execute one persisted scan using a session independent of the request."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        repository = ScanRepository(session)
        try:
            await repository.mark_running(scan_id)
            result = await run_scan(target_url, scan_id=scan_id)
            await repository.replace_with_result(result)
        except Exception as exc:
            await session.rollback()
            try:
                await repository.mark_failed(scan_id, "The scan job failed.")
            except Exception:
                logger.exception("Could not persist failed scan state", extra={"scan_id": str(scan_id)})
            logger.exception("Background scan failed", extra={"scan_id": str(scan_id)})
