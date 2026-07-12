import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from models.api_models import CreateScanResponse, HealthResponse, ScanResultResponse
from models.request_models import ScanRequest
from repositories.scan_repository import ScanRepository
from services.scan_jobs import execute_scan_job
from services.url_security import UnsafeUrlError, UrlSafetyValidator


logger = logging.getLogger(__name__)
router = APIRouter()
DatabaseSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/", response_model=HealthResponse, tags=["Health"])
async def root():
    return {"message": "BugBot API is running"}


@router.post(
    "/scan",
    response_model=CreateScanResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Scan"],
)
async def scan_website(
    data: ScanRequest,
    background_tasks: BackgroundTasks,
    session: DatabaseSession,
):
    """Create a persistent scan job and return before browser work begins."""
    try:
        target_url = str(data.url)
        await UrlSafetyValidator().validate(target_url)
        scan_id = await ScanRepository(session).create_pending(target_url)
        background_tasks.add_task(execute_scan_job, scan_id, target_url)
        return {
            "scan_id": str(scan_id),
            "status": "pending",
            "poll_url": f"/results/{scan_id}",
        }
    except UnsafeUrlError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        logger.exception("Failed to persist scan result", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The scan job could not be created.",
        ) from exc
    except Exception as exc:
        logger.exception("Scan job creation failed", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The scan job could not be created.",
        ) from exc


@router.get(
    "/results/{scan_id}", response_model=ScanResultResponse, tags=["Results"]
)
async def get_results(scan_id: UUID, session: DatabaseSession):
    """Retrieve a persisted scan and all related findings."""
    try:
        result = await ScanRepository(session).get(scan_id)
    except SQLAlchemyError as exc:
        logger.exception("Failed to retrieve scan result", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scan results are temporarily unavailable.",
        ) from exc

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan result not found",
        )
    return result
