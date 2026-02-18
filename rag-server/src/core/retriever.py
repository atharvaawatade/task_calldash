"""Retriever — orchestrates embedding + vector search for queries."""
import structlog
from ..adapters.openai_embeddings import get_embeddings
from ..adapters.qdrant_store import get_vector_store
from ..config import get_settings

logger = structlog.get_logger()


async def retrieve_context(query: str, top_k: int | None = None) -> list[dict]:
    """Retrieve relevant document chunks for a given query."""
    settings = get_settings()
    k = top_k or settings.TOP_K

    # 1. Embed the query
    embeddings = get_embeddings()
    query_vector = embeddings.embed_query(query)

    # 2. Search Qdrant
    store = get_vector_store()
    results = store.search(
        query_vector=query_vector,
        top_k=k,
        score_threshold=settings.SCORE_THRESHOLD,
    )

    logger.info(
        "Retrieved context",
        query=query[:100],
        results=len(results),
        top_score=results[0]["score"] if results else 0,
    )

    return results
