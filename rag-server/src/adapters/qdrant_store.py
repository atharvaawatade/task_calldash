"""Qdrant vector store adapter — abstracts vector DB operations."""
import uuid
import structlog
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from ..config import get_settings

logger = structlog.get_logger()


class QdrantVectorStore:
    def __init__(self):
        settings = get_settings()
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = settings.QDRANT_COLLECTION
        self.dimensions = settings.EMBEDDING_DIMENSIONS
        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)

        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.dimensions,
                    distance=Distance.COSINE,
                ),
            )
            logger.info("Created Qdrant collection", name=self.collection_name)

    def upsert_chunks(
        self,
        texts: list[str],
        embeddings: list[list[float]],
        document_id: str,
        filename: str,
    ) -> int:
        """Store text chunks with their embeddings."""
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "text": text,
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": i,
                },
            )
            for i, (text, embedding) in enumerate(zip(texts, embeddings))
        ]

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )
        logger.info("Upserted chunks", document_id=document_id, count=len(points))
        return len(points)

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        score_threshold: float = 0.3,
    ) -> list[dict]:
        """Search for similar chunks."""
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=top_k,
            score_threshold=score_threshold,
        )

        return [
            {
                "chunk_id": str(point.id),
                "text": point.payload.get("text", ""),
                "document_id": point.payload.get("document_id", ""),
                "filename": point.payload.get("filename", ""),
                "chunk_index": point.payload.get("chunk_index", 0),
                "score": point.score,
            }
            for point in results.points
        ]

    def delete_by_document(self, document_id: str) -> None:
        """Delete all chunks belonging to a document."""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )
        logger.info("Deleted chunks for document", document_id=document_id)


# Singleton
_store: QdrantVectorStore | None = None


def get_vector_store() -> QdrantVectorStore:
    global _store
    if _store is None:
        _store = QdrantVectorStore()
    return _store
