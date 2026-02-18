"""Prompt builder — constructs the LLM prompt with system prompt + RAG context."""
import httpx
import structlog
from ..config import get_settings

logger = structlog.get_logger()

DEFAULT_PROMPT = """You are a helpful AI assistant that answers questions using the context provided from uploaded documents.

When answering:
- Always reference specific information from the provided context
- If the context doesn't contain relevant information, say so honestly
- Be concise and conversational — you're speaking, not writing
- Keep responses under 3 sentences unless asked for more detail"""


async def fetch_system_prompt() -> str:
    """Fetch the current system prompt from the API server."""
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.API_SERVER_URL}/api/prompt")
            response.raise_for_status()
            data = response.json()
            return data.get("prompt", DEFAULT_PROMPT)
    except Exception as e:
        logger.warning("Could not fetch system prompt, using default", error=str(e))
        return DEFAULT_PROMPT


def build_prompt_with_context(
    system_prompt: str,
    rag_chunks: list[dict],
    user_query: str,
) -> str:
    """Build the complete prompt with RAG context injected."""
    prompt = system_prompt

    if rag_chunks:
        context_parts = []
        for i, chunk in enumerate(rag_chunks, 1):
            source = chunk.get("filename", "Unknown")
            text = chunk.get("text", "")
            score = chunk.get("score", 0)
            context_parts.append(f"[Source {i}: {source} (relevance: {score:.2f})]\n{text}")

        context = "\n\n".join(context_parts)
        prompt += f"\n\n--- Relevant Context from Documents ---\n{context}\n--- End Context ---"

    prompt += f"\n\nUser: {user_query}"
    return prompt
