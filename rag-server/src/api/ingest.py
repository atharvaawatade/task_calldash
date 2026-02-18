"""Document ingestion API endpoint."""
import uuid
import structlog
from fastapi import APIRouter, UploadFile, File, HTTPException

from ..adapters.document_parser import parse_document, SUPPORTED_EXTENSIONS
from ..adapters.openai_embeddings import get_embeddings
from ..adapters.qdrant_store import get_vector_store
from ..adapters.redis_store import (
    save_document,
    get_document,
    get_all_documents,
    delete_document as redis_delete_document,
    document_exists,
)
from ..core.chunker import chunk_text
from ..models.document import DocumentInfo, DocumentStatus

logger = structlog.get_logger()

router = APIRouter()


@router.post("/ingest", status_code=201, response_model=DocumentInfo)
async def ingest_document(file: UploadFile = File(...)):
    """Upload and process a document: parse → chunk → embed → store."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Supported: {list(SUPPORTED_EXTENSIONS)}",
        )

    doc_id = str(uuid.uuid4())
    content = await file.read()

    doc = DocumentInfo(
        id=doc_id,
        filename=file.filename,
        status=DocumentStatus.PROCESSING,
        file_size=len(content),
    )
    await save_document(doc)

    try:
        # 1. Parse document to text
        text = parse_document(content, file.filename)

        if not text.strip():
            raise ValueError("Document is empty or could not be parsed")

        # 2. Chunk text
        chunks = chunk_text(text)

        if not chunks:
            raise ValueError("No valid chunks generated from document")

        # 3. Generate embeddings
        embeddings = get_embeddings()
        vectors = embeddings.embed_texts(chunks)

        # 4. Store in Qdrant
        store = get_vector_store()
        num_stored = store.upsert_chunks(
            texts=chunks,
            embeddings=vectors,
            document_id=doc_id,
            filename=file.filename,
        )

        # 5. Update document status in Redis
        doc.status = DocumentStatus.READY
        doc.chunks = num_stored
        await save_document(doc)

        logger.info(
            "Document ingested successfully",
            doc_id=doc_id,
            filename=file.filename,
            chunks=num_stored,
        )

        return doc

    except Exception as e:
        doc.status = DocumentStatus.FAILED
        doc.error = str(e)
        await save_document(doc)
        logger.error("Ingestion failed", doc_id=doc_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.get("/documents", response_model=list[DocumentInfo])
async def list_documents():
    """List all ingested documents."""
    return await get_all_documents()


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str):
    """Delete a document and its vector embeddings."""
    if not await document_exists(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        store = get_vector_store()
        store.delete_by_document(doc_id)
        await redis_delete_document(doc_id)
        logger.info("Document deleted", doc_id=doc_id)
    except Exception as e:
        logger.error("Deletion failed", doc_id=doc_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")
