"""RAG retrieval API endpoint."""
import structlog
from fastapi import APIRouter, HTTPException
from ..models.document import RetrieveRequest, RetrieveResponse
from ..core.retriever import retrieve_context

logger = structlog.get_logger()

router = APIRouter()


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_documents(request: RetrieveRequest):
    """Retrieve relevant document chunks for a query."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        chunks = await retrieve_context(
            query=request.query,
            top_k=request.top_k,
        )

        return RetrieveResponse(
            query=request.query,
            chunks=chunks,
            total_found=len(chunks),
        )

    except Exception as e:
        logger.error("Retrieval failed", query=request.query[:100], error=str(e))
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")
