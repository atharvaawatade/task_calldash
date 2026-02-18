"""RAG retriever — HTTP client to the RAG Server."""
import httpx
import structlog
from ..config import get_settings

logger = structlog.get_logger()

# Persistent client — reuses TCP connections across calls instead of
# creating/tearing down a new connection on every user utterance.
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=10.0)
    return _client


async def close_client() -> None:
    """Call on agent shutdown to cleanly close the connection pool."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def retrieve_rag_context(query: str, top_k: int = 5) -> list[dict]:
    """Call RAG server to retrieve relevant context for a query."""
    settings = get_settings()

    try:
        response = await _get_client().post(
            f"{settings.RAG_SERVER_URL}/retrieve",
            json={"query": query, "top_k": top_k},
        )
        response.raise_for_status()
        data = response.json()
        chunks = data.get("chunks", [])
        logger.info("RAG context retrieved", query=query[:80], chunks=len(chunks))
        return chunks

    except httpx.ConnectError:
        logger.warning("RAG server unreachable, continuing without context")
        return []
    except Exception as e:
        logger.error("RAG retrieval failed", error=str(e))
        return []
