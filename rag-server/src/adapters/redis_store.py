"""Redis-backed document registry — persists document metadata across restarts."""
import redis.asyncio as aioredis
import structlog

from ..config import get_settings
from ..models.document import DocumentInfo

logger = structlog.get_logger()

DOCS_HASH_KEY = "voice-ai:documents"

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def save_document(doc: DocumentInfo) -> None:
    r = await get_redis()
    await r.hset(DOCS_HASH_KEY, doc.id, doc.model_dump_json())


async def get_document(doc_id: str) -> DocumentInfo | None:
    r = await get_redis()
    data = await r.hget(DOCS_HASH_KEY, doc_id)
    if data:
        return DocumentInfo.model_validate_json(data)
    return None


async def get_all_documents() -> list[DocumentInfo]:
    r = await get_redis()
    all_data = await r.hgetall(DOCS_HASH_KEY)
    docs = []
    for raw in all_data.values():
        try:
            docs.append(DocumentInfo.model_validate_json(raw))
        except Exception as e:
            logger.warning("Skipping corrupt document entry", error=str(e))
    return sorted(docs, key=lambda d: d.created_at)


async def delete_document(doc_id: str) -> None:
    r = await get_redis()
    await r.hdel(DOCS_HASH_KEY, doc_id)


async def document_exists(doc_id: str) -> bool:
    r = await get_redis()
    return bool(await r.hexists(DOCS_HASH_KEY, doc_id))
