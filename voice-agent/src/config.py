from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LiveKit
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""

    # AI Services
    DEEPGRAM_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    CARTESIA_API_KEY: str = ""

    # RAG Server
    RAG_SERVER_URL: str = "http://localhost:8001"

    # API Server (for prompt fetch)
    API_SERVER_URL: str = "http://localhost:3000"

    # Agent Config
    AGENT_NAME: str = "voice-ai-agent"

    model_config = {"env_file": "../.env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
