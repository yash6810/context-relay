"""
Context Relay API — FastAPI backend (AMD Hackathon Edition)
Single endpoint: POST /generate-primer
Calls Fireworks AI (Gemma 3 27B) to compress project context into a structured primer.
Falls back to a plain-text formatted version if the API call fails.
"""

import logging
import os
import time
import traceback
import math
import json
from collections import defaultdict
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("context-relay")

# ---------------------------------------------------------------------------
# Constants & Config
# ---------------------------------------------------------------------------

RATE_LIMIT_REQUESTS: int = 10
RATE_LIMIT_WINDOW_SECONDS: int = 60
MAX_FIELD_LENGTH: int = 5_000
FIREWORKS_MAX_TOKENS: int = 500

FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions"
FIREWORKS_MODEL = os.environ.get("FIREWORKS_MODEL", "accounts/fireworks/models/gpt-oss-120b")
FIREWORKS_API_KEY = os.environ.get("FIREWORKS_API_KEY", "")

# AMD Local Generative Model
AMD_LLM_URL = os.environ.get("AMD_LLM_URL")
AMD_LLM_API_KEY = os.environ.get("AMD_LLM_API_KEY", "")
AMD_LLM_MODEL = os.environ.get("AMD_LLM_MODEL", "google/gemma-2-9b-it")

# AMD Embeddings Model
AMD_EMBEDDING_URL = os.environ.get("AMD_EMBEDDING_URL")
AMD_EMBEDDING_API_KEY = os.environ.get("AMD_EMBEDDING_API_KEY", "")
AMD_EMBEDDING_MODEL = os.environ.get("AMD_EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")

PRIMER_SYSTEM_PROMPT = (
    "You are a context-compression assistant. "
    "Your job is to take raw project details provided by the user and rewrite them "
    "into a clean, structured 'primer' — a concise document that gives another AI "
    "chat assistant full project context in one go.\n\n"
    "Rules:\n"
    "- Use plain Markdown-like structure (## sections, bullet lists).\n"
    "- Be thorough but concise — the reader is another AI that needs context fast.\n"
    "- Preserve every detail provided; do not invent facts.\n"
    "- Start with a one-line project name and purpose.\n"
    "- Organise sections naturally: Overview, Current Task, Decisions Made, References.\n"
    "- Keep it under 400 words.\n"
    "- Do NOT use greetings or sign-offs — just the primer.\n"
    "- Output only the primer text, nothing else."
)

LOCAL_CLASSIFIER_NAME = "context-relay-classifier-v1"
LOCAL_WORD_LIMIT = 150
LOCAL_SIMILARITY_THRESHOLD = 0.85

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

_rate_store: dict[str, list[float]] = defaultdict(list)

def _check_rate_limit(ip: str) -> None:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    timestamps = [t for t in _rate_store[ip] if t > window_start]
    if len(timestamps) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Limit is {RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW_SECONDS}s. Try again shortly.",
        )
    timestamps.append(now)
    _rate_store[ip] = timestamps

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class GeneratePrimerRequest(BaseModel):
    project_name: str = Field(default="", max_length=MAX_FIELD_LENGTH)
    current_task: str = Field(default="", max_length=MAX_FIELD_LENGTH)
    key_decisions: str = Field(default="", max_length=MAX_FIELD_LENGTH)
    relevant_links: str = Field(default="", max_length=MAX_FIELD_LENGTH)
    additional_notes: str = Field(default="", max_length=MAX_FIELD_LENGTH)
    last_primer_content: str = Field(default="", max_length=MAX_FIELD_LENGTH)

class HealthResponse(BaseModel):
    status: str

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _word_count(text: str) -> int:
    return len(text.split()) if text.strip() else 0

def _jaccard_similarity(a: str, b: str) -> float:
    words_a = set(a.lower().split())
    words_b = set(b.lower().split())
    if not words_a and not words_b:
        return 1.0
    intersection = words_a & words_b
    union = words_a | words_b
    return len(intersection) / len(union)

def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    return dot / (norm_a * norm_b) if norm_a * norm_b > 0 else 0.0

def _build_lightweight_primer(req: GeneratePrimerRequest) -> str:
    lines = []
    if req.project_name: lines.append(f"**{req.project_name}**\n")
    if req.current_task: lines.append(f"**Current Task:**\n{req.current_task}\n")
    if req.key_decisions:
        lines.append("**Key Decisions:**")
        for line in req.key_decisions.split("\n"):
            if line.strip(): lines.append(f"• {line.strip()}")
        lines.append("")
    if req.relevant_links:
        lines.append("**Relevant Links:**")
        for line in req.relevant_links.split("\n"):
            if line.strip(): lines.append(f"• {line.strip()}")
        lines.append("")
    if req.additional_notes: lines.append(f"**Additional Notes:**\n{req.additional_notes}\n")
    return "\n".join(lines).strip()

def _classify_context_locally(req: GeneratePrimerRequest) -> dict:
    context_parts = [req.project_name, req.current_task, req.key_decisions, req.relevant_links, req.additional_notes]
    combined = " ".join(p for p in context_parts if p.strip())
    total_words = _word_count(combined)

    if total_words < LOCAL_WORD_LIMIT:
        return {"routing": "local", "primer": None} # None means we should generate it locally via string OR AMD LLM

    if req.last_primer_content:
        similarity = _jaccard_similarity(combined, req.last_primer_content)
        if similarity > LOCAL_SIMILARITY_THRESHOLD:
            return {"routing": "local", "primer": req.last_primer_content}

    return {"routing": "cloud", "primer": None}

def _build_fallback_prompt(req: GeneratePrimerRequest) -> str:
    return _build_lightweight_primer(req).replace("**", "## ")

async def _get_embeddings(texts: list[str]) -> list[list[float]]:
    if not AMD_EMBEDDING_URL:
        return [[0.1] * 768 for _ in texts]
    headers = {"Content-Type": "application/json"}
    if AMD_EMBEDDING_API_KEY: headers["Authorization"] = f"Bearer {AMD_EMBEDDING_API_KEY}"
    payload = {"model": AMD_EMBEDDING_MODEL, "input": texts}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(AMD_EMBEDDING_URL, json=payload, headers=headers)
            res.raise_for_status()
            return [item["embedding"] for item in res.json()["data"]]
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return [[0.1] * 768 for _ in texts]

async def _call_amd_local_stream(req: GeneratePrimerRequest):
    user_prompt = f"Project: {req.project_name}\nTask: {req.current_task}\nDecisions: {req.key_decisions}\nLinks: {req.relevant_links}\nNotes: {req.additional_notes}"
    payload = {
        "model": AMD_LLM_MODEL,
        "max_tokens": FIREWORKS_MAX_TOKENS,
        "temperature": 0.3,
        "stream": True,
        "messages": [{"role": "system", "content": PRIMER_SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
    }
    headers = {"Content-Type": "application/json"}
    if AMD_LLM_API_KEY: headers["Authorization"] = f"Bearer {AMD_LLM_API_KEY}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            async with client.stream("POST", AMD_LLM_URL, json=payload, headers=headers) as response:
                response.raise_for_status()
                async for chunk in response.aiter_lines():
                    if chunk.startswith("data: ") and chunk[6:].strip() != "[DONE]":
                        try:
                            content = json.loads(chunk[6:])["choices"][0]["delta"].get("content", "")
                            if content: yield f"event: chunk\ndata: {json.dumps(content)}\n\n"
                        except: pass
        except Exception as e:
            logger.error(f"AMD LLM failed: {e}")
            yield f"event: error\ndata: {json.dumps('AMD LLM failed, using fallback')}\n\n"
            yield f"event: chunk\ndata: {json.dumps(_build_fallback_prompt(req))}\n\n"

async def _call_fireworks_stream(user_prompt: str):
    if not FIREWORKS_API_KEY:
        yield f"event: error\ndata: {json.dumps('API key missing')}\n\n"
        return
    payload = {
        "model": FIREWORKS_MODEL,
        "max_tokens": FIREWORKS_MAX_TOKENS,
        "temperature": 0.5,
        "stream": True,
        "messages": [{"role": "system", "content": PRIMER_SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
    }
    headers = {"Authorization": f"Bearer {FIREWORKS_API_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            async with client.stream("POST", FIREWORKS_URL, json=payload, headers=headers) as response:
                response.raise_for_status()
                async for chunk in response.aiter_lines():
                    if chunk.startswith("data: ") and chunk[6:].strip() != "[DONE]":
                        try:
                            content = json.loads(chunk[6:])["choices"][0]["delta"].get("content", "")
                            if content: yield f"event: chunk\ndata: {json.dumps(content)}\n\n"
                        except: pass
        except Exception as e:
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"

async def _call_gemma_plan(req: GeneratePrimerRequest, chunks: list[str]) -> list[str]:
    """Uses Fireworks Gemma 3 27B to orchestrate the planning step."""
    if not FIREWORKS_API_KEY or not chunks:
        return chunks
    
    prompt = f"Task: {req.current_task}\nProject: {req.project_name}\n\nChunks:\n"
    for i, c in enumerate(chunks):
        prompt += f"[{i}] {c[:200]}...\n"
        
    payload = {
        "model": "accounts/fireworks/models/gemma-3-27b-it",
        "max_tokens": 50,
        "temperature": 0.1,
        "messages": [
            {
                "role": "system", 
                "content": "You are a context planner. Review the chunks and select only the indices of chunks that are highly relevant to the user's task. Output a comma-separated list of indices (e.g., 0,2,3). If none are relevant, output nothing. Output NOTHING ELSE but the indices."
            }, 
            {"role": "user", "content": prompt}
        ],
    }
    headers = {"Authorization": f"Bearer {FIREWORKS_API_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(FIREWORKS_URL, json=payload, headers=headers)
            res.raise_for_status()
            reply = res.json()["choices"][0]["message"]["content"]
            indices = [int(x.strip()) for x in reply.split(",") if x.strip().isdigit()]
            return [chunks[i] for i in indices if 0 <= i < len(chunks)] or chunks
        except Exception as e:
            logger.error(f"Gemma Planning failed: {e}")
            return chunks

# ---------------------------------------------------------------------------
# App lifecycle & Routes
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Context Relay API", version="1.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")

@app.post("/generate-primer")
async def generate_primer(req: GeneratePrimerRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)

    classification = _classify_context_locally(req)

    async def stream_generator():
        if classification["routing"] == "local":
            if classification["primer"]:
                yield f"event: metadata\ndata: {json.dumps({'routing': 'local', 'model_used': 'context-relay-classifier-v1'})}\n\n"
                yield f"event: chunk\ndata: {json.dumps(classification['primer'])}\n\n"
            else:
                model_name = AMD_LLM_MODEL if AMD_LLM_URL else "rule-based"
                yield f"event: metadata\ndata: {json.dumps({'routing': 'local', 'model_used': model_name})}\n\n"
                if AMD_LLM_URL:
                    async for chunk in _call_amd_local_stream(req): yield chunk
                else:
                    yield f"event: chunk\ndata: {json.dumps(_build_lightweight_primer(req))}\n\n"
        else:
            yield f"event: metadata\ndata: {json.dumps({'routing': 'cloud', 'model_used': FIREWORKS_MODEL})}\n\n"
            
            # --- AGENTIC PIPELINE ---
            # 1. RETRIEVE
            yield f"event: trace\ndata: {json.dumps({'step': 'RETRIEVE', 'status': 'running'})}\n\n"
            raw_text = f"Decisions:\n{req.key_decisions}\n\nNotes:\n{req.additional_notes}\n\nLinks:\n{req.relevant_links}"
            chunks = [c.strip() for c in raw_text.split("\n\n") if c.strip()]
            
            if len(chunks) > 0:
                query = f"Project: {req.project_name}. Task: {req.current_task}"
                embeddings = await _get_embeddings([query] + chunks)
                q_emb, c_embs = embeddings[0], embeddings[1:]
                
                scored = sorted([(i, _cosine_similarity(q_emb, e), chunks[i]) for i, e in enumerate(c_embs)], key=lambda x: x[1], reverse=True)
                top_chunks = [c[2] for c in scored[:3]]
            else:
                top_chunks = []
                
            yield f"event: trace\ndata: {json.dumps({'step': 'RETRIEVE', 'status': 'done', 'details': f'Embedded {len(chunks)} chunks, retrieved top {len(top_chunks)}'})}\n\n"
            
            # 2. PLAN
            yield f"event: trace\ndata: {json.dumps({'step': 'PLAN', 'status': 'running'})}\n\n"
            planned_chunks = await _call_gemma_plan(req, top_chunks)
            final_context = "\n\n".join(planned_chunks)
            yield f"event: trace\ndata: {json.dumps({'step': 'PLAN', 'status': 'done', 'details': f'Gemma-3 selected {len(planned_chunks)} chunks for synthesis'})}\n\n"
            
            # 3. SYNTHESIZE
            yield f"event: trace\ndata: {json.dumps({'step': 'SYNTHESIZE', 'status': 'running'})}\n\n"
            user_prompt = f"Project name: {req.project_name}\nCurrent task: {req.current_task}\n\nRelevant Context:\n{final_context}"
            
            try:
                async for chunk in _call_fireworks_stream(user_prompt):
                    if chunk.startswith("event: error"):
                        yield f"event: error\ndata: {json.dumps('AI call failed, falling back.')}\n\n"
                        yield f"event: chunk\ndata: {json.dumps(_build_fallback_prompt(req))}\n\n"
                        break
                    yield chunk
            except Exception as e:
                yield f"event: error\ndata: {json.dumps(str(e))}\n\n"
                yield f"event: chunk\ndata: {json.dumps(_build_fallback_prompt(req))}\n\n"
                
            yield f"event: trace\ndata: {json.dumps({'step': 'SYNTHESIZE', 'status': 'done', 'details': 'Synthesis complete'})}\n\n"
        
        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)