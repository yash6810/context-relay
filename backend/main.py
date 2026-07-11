"""
Context Relay API — FastAPI backend
Single endpoint: POST /generate-primer
Calls Fireworks AI (Gemma 3 27B) to compress project context into a structured primer.
Falls back to a plain-text formatted version if the API call fails.
"""

import logging
import os
import time
import traceback
from collections import defaultdict
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging — all calls logged to stdout (visible in `docker logs`)
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("context-relay")

# ---------------------------------------------------------------------------
# Rate limiting constants (adjust these for your demo)
# ---------------------------------------------------------------------------

RATE_LIMIT_REQUESTS: int = 10       # max requests per IP per window
RATE_LIMIT_WINDOW_SECONDS: int = 60  # sliding window size in seconds

# ---------------------------------------------------------------------------
# Request validation constants
# ---------------------------------------------------------------------------

MAX_FIELD_LENGTH: int = 5_000   # max characters per text field
FIREWORKS_MAX_TOKENS: int = 500  # max output tokens per Fireworks call

# ---------------------------------------------------------------------------
# In-memory rate limiter (resets on restart — intentionally minimal)
# ---------------------------------------------------------------------------

_rate_store: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(ip: str) -> None:
    """Raise HTTPException(429) if the IP has exceeded its rate limit."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    # Prune timestamps outside the window
    timestamps = [t for t in _rate_store[ip] if t > window_start]

    if len(timestamps) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Limit is {RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW_SECONDS}s. Try again shortly.",
        )

    timestamps.append(now)
    _rate_store[ip] = timestamps


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GeneratePrimerRequest(BaseModel):
    project_name: str = Field(default="", max_length=MAX_FIELD_LENGTH, description="Name of the project")
    current_task: str = Field(default="", max_length=MAX_FIELD_LENGTH, description="What the user is currently working on")
    key_decisions: str = Field(default="", max_length=MAX_FIELD_LENGTH, description="Key decisions made so far")
    relevant_links: str = Field(default="", max_length=MAX_FIELD_LENGTH, description="Relevant links or references")
    additional_notes: str = Field(default="", max_length=MAX_FIELD_LENGTH, description="Any additional notes or context")


class GeneratePrimerResponse(BaseModel):
    primer: str


class HealthResponse(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing special needed
    yield
    # Shutdown: httpx connections are cleaned up by the client instances


app = FastAPI(
    title="Context Relay API",
    description="Compresses project context into an AI primer for use across chat assistants.",
    version="1.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — wide open for Chrome extension + local dev
# In production, restrict these to known origins if the backend is a public web API.
# Chrome extensions use `chrome-extension://` origins which aren't predictable,
# so a broad CORS policy is often necessary for extension-backed APIs.
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions"
FIREWORKS_MODEL = "accounts/fireworks/models/gemma-3-27b-it"

FIREWORKS_API_KEY = os.environ.get("FIREWORKS_API_KEY", "")

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_fallback_prompt(req: GeneratePrimerRequest) -> str:
    """Build a plain-text formatted primer when the AI call fails."""
    lines = []
    if req.project_name:
        lines.append(f"# {req.project_name}")
    lines.append("")
    if req.current_task:
        lines.append("## Current Task")
        lines.append(req.current_task)
        lines.append("")
    if req.key_decisions:
        lines.append("## Key Decisions")
        lines.append(req.key_decisions)
        lines.append("")
    if req.relevant_links:
        lines.append("## Relevant Links")
        lines.append(req.relevant_links)
        lines.append("")
    if req.additional_notes:
        lines.append("## Additional Notes")
        lines.append(req.additional_notes)
        lines.append("")
    return "\n".join(lines).strip()


async def _call_fireworks(req: GeneratePrimerRequest) -> str | None:
    """Call Fireworks AI Gemma endpoint. Returns the primer text or None."""
    if not FIREWORKS_API_KEY:
        return None

    user_prompt = (
        f"Project name: {req.project_name}\n"
        f"Current task: {req.current_task}\n"
        f"Key decisions: {req.key_decisions}\n"
        f"Relevant links: {req.relevant_links}\n"
        f"Additional notes: {req.additional_notes}\n"
    )

    payload = {
        "model": FIREWORKS_MODEL,
        "max_tokens": FIREWORKS_MAX_TOKENS,
        "temperature": 0.5,
        "messages": [
            {"role": "system", "content": PRIMER_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    }

    headers = {
        "Authorization": f"Bearer {FIREWORKS_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(FIREWORKS_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception:
            traceback.print_exc()
            return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")


@app.post("/generate-primer", response_model=GeneratePrimerResponse)
async def generate_primer(req: GeneratePrimerRequest, request: Request):
    # 1. Rate limit — IP-based, per-request check
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)

    # 2. Log incoming request (no PII — just IP, fields presence, and outcome)
    fields_present = sum(1 for v in [req.project_name, req.current_task, req.key_decisions, req.relevant_links, req.additional_notes] if v)

    # 3. Try Fireworks AI first
    primer = await _call_fireworks(req)

    # 4. Fallback to plain-text formatting
    if primer is None:
        primer = _build_fallback_prompt(req)
        logger.info("HIT  source=%s fields=%d outcome=fallback", ip, fields_present)
    else:
        logger.info("HIT  source=%s fields=%d outcome=ai", ip, fields_present)

    return GeneratePrimerResponse(primer=primer)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)