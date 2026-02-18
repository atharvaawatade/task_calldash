"""OpenAI embeddings adapter — wraps embedding API calls."""
import structlog
from openai import OpenAI
from ..config import get_settings

logger = structlog.get_logger()


class OpenAIEmbeddings:
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.EMBEDDING_MODEL
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts. Returns list of embedding vectors."""
        if not texts:
            return []

        # Batch in groups of 100 (OpenAI limit is 2048 but 100 is safer)
        all_embeddings = []
        batch_size = 100

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = self.client.embeddings.create(
                model=self.model,
                input=batch,
                dimensions=self.dimensions,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
            logger.info("Embedded batch", batch_num=i // batch_size + 1, count=len(batch))

        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        """Embed a single query string."""
        response = self.client.embeddings.create(
            model=self.model,
            input=[query],
            dimensions=self.dimensions,
        )
        return response.data[0].embedding


# Singleton
_embeddings: OpenAIEmbeddings | None = None


def get_embeddings() -> OpenAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings()
    return _embeddings
