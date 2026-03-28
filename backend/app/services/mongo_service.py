from db.database import collection
from bson import ObjectId

async def save_scan_result(scan_data: dict):
    result = await collection.insert_one(scan_data)
    return str(result.inserted_id)

async def get_scan_result(scan_id: str):
    result = await collection.find_one({"_id": ObjectId(scan_id)})
    if result:
        result["_id"] = str(result["_id"])
    return result

async def update_scan_result(scan_id: str, update_data: dict):
    await collection.update_one(
        {"_id": ObjectId(scan_id)},
        {"$set": update_data}
    )
