from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from db.database import collection


def serialize_mongo_doc(data):
    """
    Recursively convert MongoDB/Python non-serializable values
    into JSON-safe values.
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


async def save_scan_result(scan_data: dict) -> str:
    safe_data = serialize_mongo_doc(scan_data)
    result = await collection.insert_one(safe_data)
    return str(result.inserted_id)


async def get_scan_result(scan_id: str) -> dict | None:
    try:
        result = await collection.find_one({"_id": ObjectId(scan_id)})
    except (InvalidId, Exception):
        return None

    if result:
        return serialize_mongo_doc(result)

    return None


async def get_all_scan_results() -> list:
    results = await collection.find().to_list(length=100)
    return serialize_mongo_doc(results)


async def update_scan_result(scan_id: str, update_data: dict) -> bool:
    try:
        safe_data = serialize_mongo_doc(update_data)

        result = await collection.update_one(
            {"_id": ObjectId(scan_id)},
            {"$set": safe_data}
        )

        return result.matched_count > 0
    except (InvalidId, Exception):
        return False


async def delete_scan_result(scan_id: str) -> bool:
    try:
        result = await collection.delete_one({"_id": ObjectId(scan_id)})
        return result.deleted_count > 0
    except (InvalidId, Exception):
        return False
