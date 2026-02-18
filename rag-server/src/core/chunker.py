"""Text chunking engine using LangChain's RecursiveCharacterTextSplitter."""
import structlog
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ..config import get_settings

logger = structlog.get_logger()


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks optimized for embedding."""
    settings = get_settings()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
        is_separator_regex=False,
    )

    chunks = splitter.split_text(text)
    # Filter out very short/empty chunks
    chunks = [c.strip() for c in chunks if len(c.strip()) > 50]

    logger.info("Chunked text", total_chars=len(text), chunks=len(chunks))
    return chunks
