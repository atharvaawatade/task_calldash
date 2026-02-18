from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class DocumentInfo(BaseModel):
    id: str
    filename: str
    status: DocumentStatus = DocumentStatus.PROCESSING
    chunks: int = 0
    file_size: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    error: str | None = None


class ChunkInfo(BaseModel):
    chunk_id: str
    document_id: str
    text: str
    metadata: dict = {}


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5


class RetrieveResponse(BaseModel):
    query: str
    chunks: list[dict]
    total_found: int
