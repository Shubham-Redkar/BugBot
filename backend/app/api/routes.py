import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from agents.scan_coordinator import run_scan
from db.postgres import get_db_session
from models.request_models import ScanRequest
from repositories.scan_repository import ScanRepository
from services.url_security import UnsafeUrlError


logger = logging.getLogger(__name__)
router = APIRouter()
DatabaseSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/", tags=["Health"])
async def root():
    return {"message": "BugBot API is running"}


@router.post("/scan", response_model=dict, status_code=status.HTTP_201_CREATED, tags=["Scan"])
async def scan_website(data: ScanRequest, session: DatabaseSession):
    """Run a scan and persist its complete result in PostgreSQL."""
    try:
        result = await run_scan(str(data.url))
        scan_id = await ScanRepository(session).create(result)
        return {"scan_id": str(scan_id), "result": result}
    except UnsafeUrlError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        logger.exception("Failed to persist scan result", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scan completed but could not be persisted.",
        ) from exc
    except Exception as exc:
        logger.exception("Website scan failed", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The website scan could not be completed.",
        ) from exc


@router.get("/results/{scan_id}", response_model=dict, tags=["Results"])
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
