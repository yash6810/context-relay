# Context Relay — Hackathon Pitch Deck

## Presenter / Team
- Presenter: [You or your team name]

## Problem
Knowledge workers use multiple AI tools (ChatGPT, Claude, Gemini, Perplexity, Grok, Mistral).
Every time they switch AI assistants, they have to re-explain:
- What they're building
- Key decisions already made
- Current blockers and context

This is wasted time and lost momentum — context breaks every time you switch.

## Solution
**Context Relay** — A browser extension that lets you define your project context once, generate a structured "primer," and inject it into any AI chat with a single click.

## Key Features
1. **Project Management** — Create projects with task, decisions, links, notes, and tags
2. **Primer Generation** — Generate structured context documents from your project data
3. **Cross-Platform Relay** — One-click injection into ChatGPT, Claude, Gemini, Perplexity, Grok, Mistral
4. **Search & Export** — Full-text search across primers, export as Markdown/JSON

## How It Works
1. **Create** — Define a project with full context (task, decisions, links, tags)
2. **Generate** — Click "Generate Primer" to produce a structured context document
3. **Relay** — Go to any AI chat, click the floating "Relay" button, select your project
4. **Done** — The AI now has full context — no re-explaining needed

## What Makes It Special
- Works across **6 AI platforms** — not locked into a single ecosystem
- Zero setup beyond installing the extension
- Privacy-first: all data stored locally in chrome.storage
- Template library for quick-starting common project types

## Tech Stack
- React 18 + TypeScript + TailwindCSS v4
- Chrome Extension Manifest V3
- chrome.storage.local (privacy-first, no server)
- Vite multi-entry build

## Status
Built and ready. Working extension with full feature set.
Supports: ChatGPT, Claude, Gemini, Perplexity, Grok, Mistral.

## The Ask (for judges)
Built in [timeframe]. Solves a real daily pain for millions of AI users.
Privacy-first, works everywhere, ready to ship.
