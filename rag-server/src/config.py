from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # OpenAI
    OPENAI_API_KEY: str = ""

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "voice_ai_docs"

    # Chunking
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 200

    # Retrieval
    TOP_K: int = 5
    SCORE_THRESHOLD: float = 0.15

    # Embedding
    EMBEDDING_MODEL: str = "text-embedding-3-large"
    EMBEDDING_DIMENSIONS: int = 3072

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Server
    RAG_PORT: int = 8001

    model_config = {"env_file": "../.env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
