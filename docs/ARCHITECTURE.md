# Architecture

## Overview

Context Relay is a Chrome extension that serves as a context bridge between AI assistants. It captures project context, generates structured primers, and relays them across supported AI platforms.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Extension                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Popup (React)│  │ Side Panel   │  │ Content Scripts        │ │
│  │ Dashboard →  │  │ (React)      │  │ ┌────┬────┬────┬────┐ │ │
│  │ Form →       │  │ Compact      │  │ │Chat│Claude│Gem│... │ │ │
│  │ Primer →     │  │ project/     │  │ └────┴────┴────┴────┘ │ │
│  │ History      │  │ primer view  │  │                        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘ │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                     │
│              ┌────────────▼─────────────┐                       │
│              │ Background Service Worker │                      │
│              │ (messaging, storage,      │                      │
│              │  lifecycle, primer API)   │                      │
│              └────────────┬─────────────┘                       │
│                           │                                     │
│              ┌────────────▼─────────────┐                       │
│              │ chrome.storage.local     │                       │
│              │ (projects, primers)      │                       │
│              └──────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   Primer Backend(s)      │
              │                          │
              │  ┌──────────────────┐    │
              │  │ FastAPI (Docker) │    │
              │  │ Fireworks AI API │    │
              │  └──────────────────┘    │
              │  ┌──────────────────┐    │
              │  │ Supabase Edge    │    │
              │  │ Function         │    │
              │  └──────────────────┘    │
              └──────────────────────────┘
```

## Extension Components

### 1. Popup (`popup.html` → `src/main.tsx`)

The full React application accessible via the extension toolbar icon. Uses `HashRouter` for client-side routing.

**Routes:**

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Project list with search & tag filters |
| `/projects/new` | ProjectForm | Create a new project |
| `/projects/:id/edit` | ProjectForm | Edit an existing project |
| `/projects/:id` | PrimerView | Generate and view primers for a project |
| `/history` | GlobalHistory | All primers across all projects |

### 2. Side Panel (`sidepanel.html` → `src/main-sidepanel.tsx`)

A compact version of the popup without routing, opened via Chrome's side panel API. Shows projects and their primers in a sidebar layout.

### 3. Content Scripts (`src/content-scripts/`)

Per-platform scripts injected into each supported AI chat page. Each script:

- Injects a floating relay button (bottom-right corner)
- Provides a panel to select a project and relay its primer to the chat input
- Includes a `captureConversation()` function that reads visible chat messages from the DOM
- Handles platform-specific DOM selectors

**Supported Platforms:**

| Platform | Script | URL |
|----------|--------|-----|
| ChatGPT | `chatgpt.ts` | chatgpt.com |
| Claude | `claude.ts` | claude.ai |
| Gemini | `gemini.ts` | gemini.google.com |
| Perplexity | `perplexity.ts` | perplexity.ai |
| Grok | `grok.ts` | grok.com |
| Mistral | `mistral.ts` | chat.mistral.ai |

**Shared Logic:** `shared.ts` contains shared relay panel UI, conversation capture panel, and migration flow logic used across all platforms.

### 4. Background Service Worker (`src/background.ts`)

The extension's central message handler and coordinator:

- **Message routing:** Handles all `chrome.runtime.onMessage` events from popup, side panel, and content scripts
- **Storage operations:** CRUD for projects and primers via `src/lib/storage.ts`
- **Primer generation:** Sends conversation text to the FastAPI backend (with local fallback)
- **Cross-tab migration:** Opens destination platform tabs and coordinates primer injection
- **Initialization:** Sets up sample data on first install

### 5. Storage Layer (`src/lib/storage.ts`)

Async storage abstraction over `chrome.storage.local` with a `localStorage` fallback for development. Provides:

- `getProjects()` / `getProject(id)`
- `saveProject(project)` / `deleteProject(id)`
- `getPrimers(projectId?)` / `getPrimer(id)` / `savePrimer(primer)`

## Primer Generation Pipeline

The hybrid routing pipeline decides how to generate each primer:

```
captureConversation() text
         │
         ▼
┌─────────────────────┐
│  Send to backend    │
│  (FastAPI / Edge    │
│   Function)         │
└─────────┬───────────┘
          │ success
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Backend responds   │     │  Backend unreachable │
│  with primer text   │     │  or error            │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Cloud primer       │     │  Local fallback     │
│  (indigo badge)     │     │  (green badge)      │
│                     │     │                     │
│  Fireworks AI       │     │  Markdown           │
│  GPT-OSS 120B       │     │  compression        │
└─────────────────────┘     └─────────────────────┘
```

- **Local (green badge):** If the AI backend is unreachable or the context is short, the primer is formatted entirely on-device via `compressText()` markdown compression
- **Cloud (indigo badge):** For longer context, the project data is sent to Fireworks AI's GPT-OSS 120B model for intelligent summarization
- Every primer records its routing origin (`local` or `cloud`) and model used

## Backend Options

### FastAPI (`backend/main.py`)

A Python FastAPI service containerized with Docker:

- `POST /generate` — Accepts `project_name`, `current_task`, `key_decisions`, `relevant_links`, `additional_notes`
- Returns structured primer text
- Uses Fireworks AI API (GPT-OSS 120B)
- Configurable via `FIREWORKS_API_KEY` and `FIREWORKS_MODEL` environment variables

### Supabase Edge Function (`supabase/functions/generate-primer/index.ts`)

A Deno-based alternative backend hosted on Supabase:

- Same API contract as the FastAPI backend
- Uses Supabase's managed infrastructure
- JWT authentication for secure access

## Build System

The build is a two-step process:

1. **Vite** builds the popup, side panel, background service worker, and main app as ES modules
2. **esbuild** independently bundles each content script as a standalone IIFE (required for Chrome content scripts which cannot use ES module imports)

Output goes to `dist/`:

```
dist/
├── assets/
├── scripts/
│   ├── main.js              # Popup app
│   ├── sidepanel.js          # Side panel app
│   ├── background.js         # Service worker
│   ├── content-chatgpt.js    # IIFE content script
│   ├── content-claude.js     # IIFE content script
│   ├── content-gemini.js     # IIFE content script
│   ├── content-perplexity.js # IIFE content script
│   ├── content-grok.js       # IIFE content script
│   └── content-mistral.js    # IIFE content script
├── icons/
├── popup.html
├── sidepanel.html
├── index.html
└── manifest.json
```

## Data Flow

### Relay Flow
1. User clicks floating relay button on an AI platform
2. Content script opens relay panel
3. User selects a project
4. Background script receives `GENERATE_PRIMER` message
5. Primer is generated (local or cloud)
6. Primer text is returned to the content script
7. Content script injects the primer into the chat input

### Capture & Migrate Flow
1. User clicks "Capture this conversation" in the relay panel
2. Content script's `captureConversation()` reads visible chat DOM
3. A new project and primer are created and saved
4. Panel switches to "Send to..." view showing destination platform buttons
5. User clicks a destination platform
6. Background script opens a new tab and sends primer text
7. Destination content script receives and injects the primer