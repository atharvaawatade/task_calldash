import logging
import json
import asyncio
import os
from pathlib import Path
from typing import AsyncIterable

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import AgentSession, UserInputTranscribedEvent
from livekit.plugins import cartesia, openai, silero

from src.config import get_settings
from src.rag.retriever import retrieve_rag_context, close_client
from src.rag.prompt_builder import fetch_system_prompt

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_env_path)

logger = logging.getLogger("voice-agent")
logging.basicConfig(level=logging.INFO)


def _on_publish_done(task: asyncio.Task) -> None:
    if not task.cancelled() and task.exception() is not None:
        logger.error("publish_data failed: %s", task.exception())


def _publish(room: rtc.Room, payload: dict) -> None:
    """Fire-and-forget publish a JSON payload to all participants via data channel."""
    if not room.local_participant:
        return
    raw = json.dumps(payload).encode()
    task = asyncio.create_task(
        room.local_participant.publish_data(raw, reliable=True)
    )
    task.add_done_callback(_on_publish_done)


class VoiceAIAgent(Agent):
    def __init__(self, *args, job_ctx: JobContext, **kwargs):
        super().__init__(*args, **kwargs)
        self.job_ctx = job_ctx

    async def on_user_turn_completed(
        self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
    ):
        """Fires right before the LLM generates a response."""
        # Extract clean text before any RAG injection
        if isinstance(new_message.content, list):
            user_text = " ".join(
                [str(c) for c in new_message.content if str(c).strip()]
            )
        else:
            user_text = new_message.content or ""

        if not user_text or len(user_text.strip()) < 2:
            return

        logger.info("User turn: %s", user_text)

        # ── 1. Send user transcript to frontend ──────────────────────
        _publish(self.job_ctx.room, {
            "type": "transcript",
            "sender": "user",
            "text": user_text.strip(),
            "is_final": True,
        })

        # ── 2. RAG retrieval ─────────────────────────────────────────
        try:
            rag_chunks = await retrieve_rag_context(user_text, top_k=3)
            if rag_chunks:
                logger.info("RAG: %d chunks retrieved", len(rag_chunks))
                context_str = "\n".join([c.get("text", "") for c in rag_chunks])
                rag_header = (
                    f"--- KNOWLEDGE BASE CONTEXT ---\n"
                    f"{context_str}\n"
                    f"----------------------------\n\n"
                )
                if isinstance(new_message.content, list):
                    new_message.content = [f"{rag_header}User Question: {user_text}"]
                else:
                    new_message.content = f"{rag_header}User Question: {user_text}"

                # Send RAG sources to frontend
                _publish(self.job_ctx.room, {
                    "type": "rag_sources",
                    "sources": rag_chunks,
                    "query": user_text,
                })
            else:
                logger.debug("RAG: no relevant chunks found")
        except Exception as e:
            logger.error("RAG error: %s", e, exc_info=True)

    async def tts_node(
        self,
        text: AsyncIterable[str],
        model_settings,
    ) -> AsyncIterable[rtc.AudioFrame]:
        """
        Override tts_node to intercept the agent's response text and
        forward it to the frontend transcript panel via data channel.
        """
        collected: list[str] = []

        async def tee(stream: AsyncIterable[str]) -> AsyncIterable[str]:
            async for chunk in stream:
                collected.append(chunk)
                yield chunk

        # Stream audio frames as normal, but collect text chunks in parallel
        async for frame in super().tts_node(tee(text), model_settings):
            yield frame

        # After all frames are yielded, send the full agent response text
        full_text = "".join(collected).strip()
        if full_text:
            logger.info("Agent response: %s", full_text[:120])
            _publish(self.job_ctx.room, {
                "type": "transcript",
                "sender": "agent",
                "text": full_text,
                "is_final": True,
            })


async def entrypoint(ctx: JobContext):
    logger.info("Entrypoint started for room: %s", ctx.room.name)

    oai_key = os.getenv("OPENAI_API_KEY")
    cart_key = os.getenv("CARTESIA_API_KEY")
    logger.info("API keys — openai=%s cartesia=%s", bool(oai_key), bool(cart_key))

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info("Participant joined: %s", participant.identity)

    instructions = (
        "You are a helpful voice AI assistant. "
        "User documents are accessible and automatically retrieved when relevant. "
        "Be conversational, concise (under 3 sentences), and friendly."
    )
    try:
        custom_prompt = await fetch_system_prompt()
        if custom_prompt:
            instructions = custom_prompt
            logger.info("Loaded custom system prompt")
    except Exception as e:
        logger.warning("Using default prompt: %s", e)

    agent = VoiceAIAgent(
        instructions=instructions,
        stt=openai.STT(model="gpt-4o-mini-transcribe", api_key=oai_key, language="en"),
        llm=openai.LLM(model="gpt-4o", api_key=oai_key),
        tts=cartesia.TTS(model="sonic-2", api_key=cart_key),
        job_ctx=ctx,
    )

    session = AgentSession(vad=silero.VAD.load())

    @session.on("user_input_transcribed")
    def on_transcribed(ev: UserInputTranscribedEvent):
        # Log interim transcripts for debugging; final ones are sent in on_user_turn_completed
        if ev.is_final:
            logger.info("STT final: %s", ev.transcript)

    logger.info("Starting agent session...")
    await session.start(agent, room=ctx.room)
    logger.info("Session active — agent processing audio")

    ctx.add_shutdown_callback(close_client)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


if __name__ == "__main__":
    settings = get_settings()
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
            ws_url=settings.LIVEKIT_URL,
        ),
    )
