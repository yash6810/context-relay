"""
Context Relay API — FastAPI backend
Single endpoint: POST /generate-primer
Calls Fireworks AI (Gemma 3 27B) to compress project context into a structured primer.
Falls back to a plain-text formatted version if the API call fails.
"""

import os
import traceback
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GeneratePrimerRequest(BaseModel):
    project_name: str = Field(default="", description="Name of the project")
    current_task: str = Field(default="", description="What the user is currently working on")
    key_decisions: str = Field(default="", description="Key decisions made so far")
    relevant_links: str = Field(default="", description="Relevant links or references")
    additional_notes: str = Field(default="", description="Any additional notes or context")


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
    # Shutdown: httpx connections are cleaned up by the client instances below


app = FastAPI(
    title="Context Relay API",
    description="Compresses project context into an AI primer for use across chat assistants.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow all origins, methods, and headers
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
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
    """Call Fireworks AI Gemma endpoint.  Returns the primer text or None."""
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
        "max_tokens": 500,
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
async def generate_primer(req: GeneratePrimerRequest):
    # Try Fireworks AI first
    primer = await _call_fireworks(req)

    # Fallback to plain-text formatting
    if primer is None:
        primer = _build_fallback_prompt(req)

    return GeneratePrimerResponse(primer=primer)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)