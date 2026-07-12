from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

from config import get_settings


_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(get_settings().mongo_uri)
    return _client


def get_collection() -> AsyncIOMotorCollection:
    settings = get_settings()
    return get_mongo_client()[settings.db_name][settings.collection_name]


def close_database() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
