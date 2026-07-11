<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/icons/icon128.svg">
    <img alt="Context Relay" height="80" src="public/icons/icon128.svg">
  </picture>
  <h1>Context Relay</h1>
  <p><strong>Capture once. Relay everywhere.</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#development">Development</a> •
    <a href="docs/ARCHITECTURE.md">Full Docs</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-active-success" alt="Active">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
    <img src="https://img.shields.io/badge/version-1.0.0-black" alt="Version">
  </p>
</div>

---

Context Relay is a browser extension that eliminates the friction of switching between AI assistants. Define your project context once, generate a structured primer, and inject it into any supported AI chat — ChatGPT, Claude, Gemini, Perplexity, Grok, or Mistral — with a single click.

---

## Features

### Project Management
- Full context capture: current task, key decisions, links, notes, and tags
- Create from scratch or use pre-built templates (Web Apps, APIs, Extensions, etc.)
- Search, tag filtering, and sort controls on the dashboard
- Edit and evolve context as your project progresses

### Primer Generation (Agentic Pipeline)
- Generate structured, formatted primers from your project data
- **Agentic Pipeline** — each generation passes through a 3-step pipeline powered by AMD hardware and Gemma models:
  - **RETRIEVE:** Embedded chunks are ranked via Cosine Similarity against your current task.
  - **PLAN:** A Gemma 3 27B model acts as an orchestrator, evaluating all chunks and filtering out noise.
  - **SYNTHESIZE:** The curated chunks are passed to a lightweight, blazing-fast local model (Gemma 2 9B) to write the final structured markdown primer.
- **Server-Sent Events (SSE)** — Watch the Agentic Pipeline think in real-time with a live progress stepper in the UI.
- Every primer records its routing origin (`local` or `cloud`) and model used, visible as an inline badge on history cards.

### Cross-Platform Relay & Smart Context
- **Auto-Scrape Context:** Right-click any webpage to instantly extract readability-style text and auto-populate a new project.
- **Context Drift Detector:** When typing in any AI chat, the extension passively compares your prompt against the injected primer. If your prompt completely diverges, it shows a UI warning to generate a new primer!
- **Resume-Where-I-Left-Off:** The Dashboard detects your active browser tab and auto-sorts matching projects to the top of the list.
- **Token / Cost Dashboard:** Track exactly how many tokens and cloud API dollars you saved by utilizing the local AMD ROCm fallback!

Floating relay buttons injected directly into six major AI platforms:

| Platform | URL | Status |
|----------|-----|--------|
| ChatGPT | chatgpt.com | ✅ |
| Claude | claude.ai | ✅ |
| Gemini | gemini.google.com | ✅ |
| Perplexity | perplexity.ai | ✅ |
| Grok | grok.com | ✅ |
| Mistral | chat.mistral.ai | ✅ |

Select a project from the relay popup and the primer is inserted into the chat input — ready to send.

### Export
- Download primers as Markdown (`.md`) or JSON (`.json`)
- Bulk export from the History page
- Copy shareable links to individual primers

### UI
- Clean, minimal design with dark mode support
- Responsive layouts for popup, side panel, and full-screen preview
- Smooth transitions and micro-interactions

---

## Architecture

```
┌──────────────────────────────┐     ┌──────────────────────────────┐
│        Popup (React)          │     │       Side Panel (React)      │
│  Dashboard → Form → Primer    │     │  Compact project/primer       │
│  → History                    │     │  browser                      │
└─────────────┬────────────────┘     └──────────────┬───────────────┘
              │                                     │
              └──────────────┬──────────────────────┘
                             │
              ┌──────────────▼──────────────────────┐
              │    Background Service Worker         │
              │  Messaging, storage, lifecycle       │
              └──────────────┬──────────────────────┘
                             │
              ┌──────────────▼──────────────────────┐
              │           Content Scripts            │
              │  ┌──────┬──────┬──────┬──────┐      │
              │  │Chat  │Claude│Gemini│ ...  │      │
              │  └──────┴──────┴──────┴──────┘      │
              └─────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 18, TypeScript |
| **Styling** | TailwindCSS v4 (design tokens) |
| **Routing** | React Router v7 |
| **Build** | Vite 7 (multi-entry) |
| **Extension** | Manifest V3 (Chrome, Edge, Firefox) |
| **Storage** | chrome.storage.local (localStorage fallback for dev) |

### Project Structure

```
src/
├── components/          # Shared UI components (Layout)
├── context/             # React context providers (ThemeContext)
├── content-scripts/     # Injected into AI chat pages
│   ├── chatgpt.ts       ─ ChatGPT relay
│   ├── claude.ts        ─ Claude relay
│   ├── gemini.ts        ─ Gemini relay
│   ├── perplexity.ts    ─ Perplexity relay
│   ├── grok.ts          ─ Grok relay
│   ├── mistral.ts       ─ Mistral relay
│   └── shared.ts        ─ Shared injection logic
├── lib/                 # Utilities & data layer
│   ├── constants.ts     ─ Site selectors, config, templates
│   ├── storage.ts       ─ Async storage abstraction
│   └── sample-data.ts   ─ Demo data for development
├── pages/               # Route pages
│   ├── Dashboard.tsx    ─ Project list with search & tags
│   ├── ProjectForm.tsx  ─ Create/edit projects
│   ├── PrimerView.tsx   ─ Primer generation & export
│   └── GlobalHistory.tsx─ All primers with bulk export
├── App.tsx              ─ Route definitions
├── AppSidepanel.tsx     ─ Side panel view
├── main.tsx             ─ Popup entry point
├── main-sidepanel.tsx   ─ Side panel entry point
├── background.ts        ─ Service worker
├── types.ts             ─ TypeScript type definitions
└── index.css            ─ Global styles & Tailwind theme
```

---

## AMD & Infrastructure Usage

Context Relay is highly optimized for the **AMD Developer Hackathon: ACT II**. 

### How it utilizes the stack:
- **AMD Developer Cloud (ROCm):** The fast generative tier (`google/gemma-2-9b-it`) and embedding models (`BAAI/bge-large-en-v1.5`) are hosted on AMD Instinct GPUs using **vLLM** and **Text Embeddings Inference (TEI)**. 
- **Fireworks AI & Gemma Models:** A Fireworks AI API (`accounts/fireworks/models/gemma-3-27b-it`) acts as the "Planner" orchestrator in the Agentic Pipeline.
- **Intelligent Routing:** The backend seamlessly routes between the local AMD tier and the cloud tier depending on workload complexity, generating huge cost savings (trackable in the extension's dashboard).

### Contributors
- **vivekisadev** - Architected and engineered the Agentic Pipeline (Retrieve, Plan, Synthesize), AMD Developer Cloud integration, Gemma model support, Auto-Scrape, Context Drift detection, and the Token Savings dashboard.

---

## Installation

### Prerequisites

- Node.js 20+
- npm 9+

### Chrome / Edge / Firefox

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build
```

**Load the extension:**
1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

**Pin for quick access:**
- Click the puzzle piece icon in the toolbar
- Find "Context Relay" and click the pin icon

### Development Preview

The application also runs as a standalone web app for development:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — sample data is loaded automatically for testing.

---

## Usage

### Create a Project
1. Click the Context Relay icon in your toolbar
2. Click **New Project** (or **Templates** for a pre-built starter)
3. Fill in the project name, current task, key decisions, links, notes, and tags
4. Click **Save**

### Generate a Primer
1. Open a project from the dashboard
2. Click **Generate Primer**
3. The formatted primer is saved with a timestamp
4. Click **Copy** to copy to clipboard, or **Export** to download

### Relay to an AI Agent
1. Navigate to ChatGPT, Claude, Gemini, Perplexity, Grok, or Mistral
2. Click the floating **Relay** button (bottom-right corner)
3. Select a project from the list
4. The primer is inserted into the chat input — press Enter to send

### Search & Filter
- Dashboard search bar filters projects by name, task, or tag
- Click tag buttons to filter projects by tag
- History page searches primers by keyword or project

### Export
- **Per primer:** Click **Export** on any primer card → Markdown or JSON
- **Bulk:** On the History page, click **Export All** for all visible primers
- **Share:** Copy a shareable link to any primer

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser preview) |
| `npm run build` | Build extension to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run package` | Build and prepare for distribution |

### Adding a New AI Platform

1. Create a content script in `src/content-scripts/<platform>.ts`
2. Register it in `manifest.json` under `content_scripts`
3. Add it to the platforms array in `scripts/build-content-scripts.js`
4. Add the site's hostname and selectors to `src/lib/constants.ts`

### Code Quality

- TypeScript strict mode
- ESLint configured via `eslint.config.js`
- `noUnusedLocals` and `noUnusedParameters` enforced
- TailwindCSS design tokens for consistent styling

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system architecture and data flow |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Dev setup, debugging, and workflow |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy the extension and backend |
| [API.md](docs/API.md) | API reference and message types |
| [PRIVACY.md](PRIVACY.md) | Privacy policy and data handling |
| [SECURITY.md](SECURITY.md) | Security policy and reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[MIT](LICENSE) © Context Relay