# Changelog

All notable changes to Context Relay are documented here.

## [1.0.1] — 2026-07-07

### Fixed
- Content scripts now bundle as standalone IIFE via esbuild instead of ES modules, fixing "Cannot use import statement outside a module" runtime error in Chrome.
- `generatePrimer()` in background service worker now sends `project_name` and `current_task` fields matching the FastAPI Pydantic schema (was sending `transcript` and `context`, which the backend ignored).
- `captureConversation()` in `claude.ts` now uses real DOM selectors (`[data-testid="user-message"]` and `[class*="font-claude-response-body"]`) confirmed via DevTools inspection — was using guessed class names that don't exist in Claude's current DOM.
- Removed unused `readdirSync` import from content scripts build script.
- Removed stale comment from `vite.config.ts`.

### Changed
- `vite.config.ts` rollup input now only includes `main`, `popup`, `sidepanel`, and `background` — content scripts are built separately by esbuild.
- Build script runs `vite build` then `node scripts/build-content-scripts.js`.
- Content scripts target `chrome100` and `browser` platform for maximum compatibility.

## [1.0.0] — Initial Release

### Features
- **Project Management:** Create, edit, search, and organize projects with context fields (current task, key decisions, relevant links, additional notes, tags).
- **Primer Generation:** Generate structured, formatted primers from project data using a hybrid routing pipeline — local markdown compression for short context, Fireworks AI GPT-OSS 120B for longer context via FastAPI backend.
- **Cross-Platform Relay:** Floating relay buttons injected into ChatGPT, Claude, Gemini, Perplexity, Grok, and Mistral. Select a project and inject its primer into any AI chat with one click.
- **Conversation Capture:** Capture conversations from any supported AI platform, auto-generate a project, and migrate the context to another platform.
- **Global History:** View all generated primers with search, filtering, and bulk export (Markdown or JSON).
- **Dark Mode:** Class-based dark mode toggle that persists across sessions.
- **Design System:** Neutral-based palette with indigo accent, system fonts, clean minimal UI, responsive at 375/768/1024/1440px.

### Architecture
- Chrome Extension Manifest V3
- React 18 + TypeScript + TailwindCSS v4
- Vite 7 (multi-entry build)
- FastAPI backend (Docker containerized)
- Supabase Edge Function alternative backend
- `chrome.storage.local` with `localStorage` fallback for development