from fastapi import APIRouter, HTTPException
from models.request_models import ScanRequest
from agents.testing_agent import run_full_scan
from services.mongo_service import save_scan_result, get_scan_result

router = APIRouter()


@router.get("/", tags=["Health"])
async def root():
    return {"message": "BugBot API is running"}


@router.post("/scan", response_model=dict, tags=["Scan"])
async def scan_website(data: ScanRequest):
    """
    Crawl a website, run automated tests, enrich issues with AI,
    persist to MongoDB, and return the full result.
    """
    try:
        result = await run_full_scan(str(data.url))
        scan_id = await save_scan_result(result)
        return {"scan_id": scan_id, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{scan_id}", response_model=dict, tags=["Results"])
async def get_results(scan_id: str):
    """Retrieve a previously saved scan result by ID."""
    result = await get_scan_result(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scan result not found")
    return result
