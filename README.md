<div align="center">

# CHROME — Voice AI Protocol

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-313131?style=flat-square&logo=webrtc&logoColor=white)](https://livekit.io/)
[![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Cartesia](https://img.shields.io/badge/Cartesia_Sonic-FF4F00?style=flat-square)](https://cartesia.ai/)
[![Qdrant](https://img.shields.io/badge/Qdrant-D61F33?style=flat-square)](https://qdrant.tech/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)

**End-to-end real-time voice agent · WebRTC via LiveKit · RAG over uploaded documents · Live transcript & source panel**

</div>

---

## What It Does

CHROME lets you have a **live voice conversation** with an AI agent that can answer questions from documents you upload — in real-time, over WebRTC.

- **Speak** → Whisper STT → GPT-4o (with RAG context) → Cartesia TTS → **Hear the answer**
- **Upload** a PDF/DOCX/TXT/MD → chunked, embedded, stored in Qdrant vector DB
- **Edit** the system prompt from the UI — agent picks it up instantly
- **See** which document chunks were retrieved and their relevance scores

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (React 19 + LiveKit Client)                             │
│  • WebRTC audio  • REST (token, prompt, docs)  • Data channel    │
└────────┬──────────────────────────┬─────────────────────────────┘
         │ WebRTC                   │ HTTP
         ▼                          ▼
  ┌─────────────┐          ┌─────────────────┐
  │  LiveKit    │          │  Node / Fastify  │  ← API Gateway
  │  SFU Cloud  │          │  :3000           │    Token gen
  └──────┬──────┘          └────────┬────────┘    Prompt (Redis)
         │ subscribe                │ proxy        Doc upload
         ▼                          ▼
  ┌─────────────────┐      ┌─────────────────┐
  │  Voice Agent    │      │  RAG Server     │  ← FastAPI :8001
  │  (Python)       │◄─────│  (Python)       │    Parse → chunk
  │  STT→LLM→TTS   │ HTTP  │                 │    Embed → Qdrant
  └─────────────────┘      └────────┬────────┘    Redis doc store
                                    │
                           ┌────────┴────────┐
                           │  Qdrant :6333   │  Vector DB
                           └─────────────────┘
```

**RAG flow during a live call:**
```
User speaks → Whisper STT → on_user_turn_completed()
           → embed query → Qdrant vector search (top-3 chunks)
           → inject context into user message
           → GPT-4o generates answer
           → Cartesia Sonic-2 TTS → LiveKit → user hears response
           → data channel sends chunk metadata → frontend RAG panel
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, Zustand, TanStack Query |
| WebRTC | LiveKit Client SDK, LiveKit Agents (Python) |
| STT | OpenAI Whisper (`gpt-4o-mini-transcribe`) |
| LLM | OpenAI GPT-4o |
| TTS | Cartesia Sonic-2 (~90ms latency) |
| VAD | Silero VAD |
| RAG / Embeddings | OpenAI `text-embedding-3-large` (3072d) |
| Vector DB | Qdrant v1.13 |
| Document parsing | pypdf, python-docx |
| Text splitting | LangChain `RecursiveCharacterTextSplitter` |
| API Gateway | Node.js 20, Fastify 5, TypeScript |
| Cache / Persistence | Redis 7 (system prompt + document registry) |
| Infrastructure | Docker Compose, Nginx |

---

## Project Structure

```
voice-ai-agent/
├── client/                   # React 19 frontend (Vite)
│   └── src/features/
│       ├── voice-call/       # LiveKit room, mic controls, visualizer
│       ├── document-upload/  # Drag-drop KB management
│       ├── prompt-editor/    # Editable system prompt
│       └── transcript/       # Live feed + RAG sources panel
│
├── server/                   # Node.js API gateway (Fastify)
│   └── src/
│       ├── routes/           # /api/token, /api/prompt, /api/documents
│       └── services/         # LiveKit token gen, Redis prompt, doc proxy
│
├── voice-agent/              # Python LiveKit agent
│   └── src/
│       ├── agent.py          # Main orchestrator (STT → RAG → LLM → TTS)
│       └── rag/              # Retriever + prompt builder
│
├── rag-server/               # Python FastAPI RAG service
│   └── src/
│       ├── api/              # /ingest, /retrieve, /documents, /health
│       ├── core/             # Chunker, retriever
│       └── adapters/         # OpenAI embeddings, Qdrant, Redis, parser
│
├── docker/                   # Dockerfiles + nginx.conf
├── docker-compose.yml
├── .env.example
└── Makefile
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | ✅ | LiveKit cloud URL (e.g. `wss://your-project.livekit.cloud`) |
| `LIVEKIT_API_KEY` | ✅ | LiveKit API key |
| `LIVEKIT_API_SECRET` | ✅ | LiveKit API secret |
| `OPENAI_API_KEY` | ✅ | OpenAI key (STT + LLM + embeddings) |
| `CARTESIA_API_KEY` | ✅ | Cartesia key (TTS) |
| `DEEPGRAM_API_KEY` | ✅ | Deepgram key (fallback STT) |
| `QDRANT_URL` | auto | Defaults to `http://localhost:6333` |
| `REDIS_URL` | auto | Defaults to `redis://localhost:6379` |
| `GATEWAY_PORT` | auto | API gateway port, default `3000` |

> **Get keys:**
> - LiveKit: [livekit.io](https://livekit.io) → Create free project
> - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
> - Cartesia: [play.cartesia.ai](https://play.cartesia.ai) → API Keys (free $5 credit)

---

## Running — Option A: Docker (Recommended)

Requires Docker Desktop 24+.

```bash
# 1. Clone & configure
git clone <repo-url>
cd voice-ai-agent
cp .env.example .env
# Fill in API keys in .env

# 2. Build & start everything
docker-compose up --build -d

# 3. Open UI
open http://localhost:5173

# 4. Check service health
curl http://localhost:3000/api/health
curl http://localhost:8001/health
```

> **Note:** The voice agent runs in a Docker container but connects to **LiveKit Cloud** for WebRTC, so no local port exposure is needed for audio.

---

## Running — Option B: Local Dev (Hot Reload)

Requires: Docker, Node.js 20, Python 3.12, pnpm.

### Step 1 — Start Infrastructure

```bash
docker-compose up -d redis qdrant
```

### Step 2 — API Gateway (Terminal 1)

```bash
cd server
pnpm install
pnpm dev
# ✅ http://localhost:3000
```

### Step 3 — RAG Server (Terminal 2)

```bash
cd rag-server
pip install -e .
uvicorn src.main:app --reload --port 8001
# ✅ http://localhost:8001
```

### Step 4 — Voice Agent (Terminal 3)

```bash
cd voice-agent
pip install -e .
python -m src.agent start
# ✅ Agent connects to LiveKit and waits for participants
```

### Step 5 — Frontend (Terminal 4)

```bash
cd client
pnpm install
pnpm dev
# ✅ http://localhost:5173
```

### Verify

```
http://localhost:5173        → Frontend UI
http://localhost:3000/api/health → {"status":"ok"}
http://localhost:8001/health → {"status":"ok"}
http://localhost:6333/healthz → Qdrant health
```

---

## How to Run LiveKit

**Option A — LiveKit Cloud (easiest, recommended for demo):**
1. Sign up at [livekit.io](https://livekit.io)
2. Create a project → copy `URL`, `API Key`, `API Secret` into `.env`
3. That's it — no local server needed

**Option B — Self-hosted:**
```bash
# Install LiveKit CLI
brew install livekit-cli   # macOS
# or: https://github.com/livekit/livekit/releases

# Start local server
livekit-server --dev --bind 0.0.0.0

# Update .env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

---

## How the RAG Pipeline Works

This is the core technical value — understanding this is key for demos.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  INGESTION (before the call)                                    │
 │                                                                 │
 │  Upload file → parse text (pypdf / python-docx)                 │
 │             → split into chunks (800 chars, 200 overlap)        │
 │             → embed each chunk (text-embedding-3-large, 3072d)  │
 │             → upsert vectors + metadata into Qdrant             │
 │             → persist document record in Redis                  │
 └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │  LIVE CALL (real-time, fires on every user utterance)           │
 │                                                                 │
 │  1. User speaks  →  LiveKit WebRTC stream                       │
 │  2. Silero VAD detects end-of-speech                            │
 │  3. OpenAI Whisper STT  →  plain text transcript                │
 │  4. on_user_turn_completed() hook fires:                        │
 │       a) embed query with same model used at ingestion          │
 │       b) cosine-similarity search Qdrant  (top-3, score≥0.15)  │
 │       c) inject chunks into user message content:               │
 │              "--- KNOWLEDGE BASE CONTEXT ---                    │
 │               {chunk 1} ... {chunk 3}                           │
 │               ---                                               │
 │               User Question: {transcript}"                      │
 │  5. GPT-4o generates a grounded answer                          │
 │  6. Cartesia Sonic-2 TTS  →  audio (~90ms latency)              │
 │  7. Audio streamed back to user via LiveKit                     │
 │  8. Data channel sends chunk metadata → RAG Sources panel       │
 └─────────────────────────────────────────────────────────────────┘
```

**Why inject into the user message, not the system prompt?**
Context is tied to the exact turn — GPT-4o attends more strongly to recent tokens, and it avoids polluting the system prompt with potentially irrelevant context across multiple turns.

**Chunking:** `RecursiveCharacterTextSplitter` (800 chars, 200-char overlap). Overlap prevents information loss at chunk boundaries.

**Embedding model parity:** `text-embedding-3-large` is used for *both* ingestion and query — using the same model is critical because mismatched models produce incomparable vector spaces.

---

## Using the App

### 1. Upload a Document
Drag & drop a PDF, DOCX, TXT, or MD file into the **Intelligence** panel.
Watch it go `processing` → `ready` with chunk count shown.

### 2. Customize the System Prompt
Edit the text in the **Core Logic** panel and click **Update Core**.
The voice agent fetches this from Redis before each conversation.

### 3. Start a Voice Call
Click **Initialize** in the **Audio Core** panel.
Allow microphone access when prompted.
Speak — the agent will transcribe, retrieve relevant context, and respond via voice.

### 4. Watch RAG in Action
The **Retrieval Engine** panel shows which document chunks were used for each answer, with relevance scores. The **Live Feed** shows the full transcript.

---

## Makefile Shortcuts

```bash
make infra    # Start Redis + Qdrant only (local dev)
make up       # Start all services via Docker
make down     # Stop all services
make logs     # Tail all service logs
make dev      # Start infra + print local dev instructions
make clean    # Remove all containers, volumes, node_modules
```

---

## Known Limitations / Tradeoffs

| Area | Detail |
|------|--------|
| **Single room** | All users join the same LiveKit room (`voice-ai-room`). No multi-tenant isolation. |
| **Shared KB** | One Qdrant collection for all users — no per-user document isolation. |
| **No auth** | No user authentication. Intended for demo/single-user use. |
| **PDF OCR** | Text-layer PDFs only. Scanned image PDFs are not supported (no OCR). |
| **Voice agent scale** | Single worker process. For concurrent rooms, run multiple worker instances. |
| **Postgres** | Provisioned in docker-compose but unused — Redis handles all persistence needs for this scope. |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Connection failed` | Check API server on `:3000` — `curl http://localhost:3000/api/health` |
| No agent voice response | Check voice-agent terminal logs; verify LiveKit keys in `.env` |
| Upload fails | Check RAG server on `:8001` — `curl http://localhost:8001/health` |
| RAG panel empty | Documents must be `ready` before calling; check Qdrant is running |
| Prompt not saving | Verify Redis: `docker-compose ps redis` |
| Mic blocked | Check browser microphone permissions (lock icon in address bar) |
| `OPENAI_API_KEY` error | Verify key is set in `.env` and the file is in project root |

---

<div align="center">

**OpenAI · Cartesia · LiveKit · Qdrant · Redis**

</div>
