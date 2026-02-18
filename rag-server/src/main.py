from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from .api.ingest import router as ingest_router
from .api.retrieve import router as retrieve_router
from .api.health import router as health_router
from .adapters.redis_store import close_redis

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RAG Server starting up")
    yield
    logger.info("RAG Server shutting down")
    await close_redis()


app = FastAPI(
    title="Voice AI RAG Server",
    description="Document ingestion and retrieval service for Voice AI",
    version="1.0.0",
    lifespan=lifespan,
)

# rag-server is an internal service called only by the Node gateway.
# Credentials are not needed; wildcard origin is safe here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(retrieve_router)
app.include_router(health_router)
