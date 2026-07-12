from fastapi import APIRouter, HTTPException
from models.request_models import ScanRequest
from agents.scan_coordinator import run_scan
from services.mongo_service import save_scan_result, get_scan_result
from bson import ObjectId
from datetime import datetime


router = APIRouter()


def serialize_mongo_doc(data):
    """
    Recursively convert non-JSON-serializable Mongo/Python types
    into FastAPI-safe values.
    """
    if isinstance(data, list):
        return [serialize_mongo_doc(item) for item in data]

    if isinstance(data, dict):
        return {
            key: serialize_mongo_doc(value)
            for key, value in data.items()
        }

    if isinstance(data, ObjectId):
        return str(data)

    if isinstance(data, datetime):
        return data.isoformat()

    if isinstance(data, set):
        return list(data)

    return data


@router.get("/", tags=["Health"])
async def root():
    return {"message": "BugBot API is running"}


@router.post("/scan", response_model=dict, tags=["Scan"])
async def scan_website(data: ScanRequest):
    """
    Scan a website, enrich issues, save to MongoDB.
    """
    try:
        result = await run_scan(str(data.url))

        # Serialize before saving/returning
        safe_result = serialize_mongo_doc(result)

        scan_id = await save_scan_result(safe_result)

        return {
            "scan_id": scan_id,
            "result": safe_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{scan_id}", response_model=dict, tags=["Results"])
async def get_results(scan_id: str):
    """
    Retrieve a saved scan result by ID.
    """
    result = await get_scan_result(scan_id)

    if not result:
        raise HTTPException(status_code=404, detail="Scan result not found")

    return serialize_mongo_doc(result)
