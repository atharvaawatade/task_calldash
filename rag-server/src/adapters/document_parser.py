"""Document parser adapter — handles PDF, DOCX, TXT, MD files."""
import io
import structlog
from pypdf import PdfReader
from docx import Document as DocxDocument

logger = structlog.get_logger()

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


def parse_document(content: bytes, filename: str) -> str:
    """Parse document content to plain text based on file extension."""
    ext = _get_extension(filename)

    if ext == ".pdf":
        return _parse_pdf(content)
    elif ext == ".docx":
        return _parse_docx(content)
    elif ext in (".txt", ".md"):
        return _parse_text(content)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: {SUPPORTED_EXTENSIONS}")


def _get_extension(filename: str) -> str:
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _parse_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text.strip())
    result = "\n\n".join(text_parts)
    logger.info("Parsed PDF", pages=len(reader.pages), chars=len(result))
    return result


def _parse_docx(content: bytes) -> str:
    doc = DocxDocument(io.BytesIO(content))
    text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
    result = "\n\n".join(text_parts)
    logger.info("Parsed DOCX", paragraphs=len(text_parts), chars=len(result))
    return result


def _parse_text(content: bytes) -> str:
    result = content.decode("utf-8", errors="ignore")
    logger.info("Parsed text file", chars=len(result))
    return result
