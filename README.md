<｜DSML｜parameter name="content" string="true"># Context Relay

> **Never lose your AI context again. Capture, organize, and relay project context across ChatGPT, Claude, and Gemini — instantly.**

Context Relay is a Chrome extension that saves you from the endless cycle of re-explaining your project every time you switch AI assistants. Define your project context once, generate a structured "primer," and inject it into any supported AI chat with a single click.

---

## The Problem

You work across multiple AI tools — ChatGPT for brainstorming, Claude for deep analysis, Gemini for research. Every time you switch, you have to re-explain:

- What you're building
- Key decisions already made
- Relevant links and references
- Current blockers

That's wasted time and lost context.

## The Solution

Context Relay lets you **define a project once**, generate a structured primer, and relay it to any AI agent in seconds. Your context follows you everywhere.

---

## Features

### 📦 Project Management
- Create and organize projects with full context: current task, key decisions, relevant links, and notes
- Edit and update projects as your context evolves
- Clean card-based dashboard with sorting by last updated

### 📝 Primer Generation
- Generate structured, formatted primers from your project context
- Primers are saved with timestamps and version history
- Expandable card view for reading full primers
- One-click copy to clipboard

### 🔗 Cross-Platform Relay
- **ChatGPT** — Floating relay button on chatgpt.com
- **Claude** — Floating relay button on claude.ai
- **Gemini** — Floating relay button on gemini.google.com
- Select a project and inject its primer directly into the chat input

### 🔍 Search / Filter
- Search across all primers by project or keyword
- Instant filtering as you type

### 📥 Export
- Download primers as Markdown, JSON, or shareable link
- Preserve formatting and structure in every format

### 🌙 Modern UI
- Clean, minimal design with indigo accent
- Full dark mode support with persistent preference
- Responsive layout (popup, side panel, or full browser preview)
- Smooth transitions and micro-interactions throughout

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Popup (React)                   │
│  Dashboard → Project Form → Primer View → History │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│               Side Panel (React)                  │
│         Compact project & primer browser          │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│         Background Service Worker                 │
│    Messaging, storage, extension lifecycle        │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│              Content Scripts                      │
│  ┌──────────┬───────────┬──────────────┐         │
│  │ ChatGPT  │  Claude   │   Gemini     │         │
│  └──────────┴───────────┴──────────────┘         │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 18 + TypeScript |
| **Styling** | TailwindCSS v4 with design tokens |
| **Routing** | React Router v7 (HashRouter) |
| **Build Tool** | Vite 7 (multi-entry build) |
| **Extension** | Chrome Manifest V3 |
| **Storage** | `chrome.storage.local` (fallback to `localStorage` for dev) |
| **Icons** | Inline SVG (no icon library dependency) |

### Project Structure

```
src/
├── components/         # Shared UI components
│   └── Layout.tsx      # Main layout with header, nav, dark mode toggle
├── context/            # React context providers
│   └── ThemeContext.tsx # Dark/light mode
├── content-scripts/    # Injected into AI chat pages
│   ├── chatgpt.ts
│   ├── claude.ts
│   ├── gemini.ts
│   └── shared.ts       # Shared content script logic
├── lib/                # Utilities and data layer
│   ├── constants.ts    # Site selectors, config
│   ├── storage.ts      # Async storage with caching layer
│   └── sample-data.ts  # Demo data
├── pages/              # Route pages
│   ├── Dashboard.tsx   # Project list
│   ├── ProjectForm.tsx # Create/edit project
│   ├── PrimerView.tsx  # Per-project primer history
│   └── GlobalHistory.tsx # All primers across projects
├── App.tsx             # Route definitions
├── AppSidepanel.tsx    # Side panel entry
├── main.tsx            # Popup entry
├── main-sidepanel.tsx  # Side panel entry
├── background.ts       # Service worker
├── types.ts            # TypeScript types
└── index.css           # Global styles + Tailwind theme tokens
```

---

## Installation

### Chrome Extension

1. **Build the extension**
   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**
   - Open `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Pin the extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Context Relay" and click the pin icon

### Development Preview

The app also runs as a standalone web app for development:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The dev preview includes sample data automatically.

---

## Usage

### Creating a Project
1. Click the Context Relay icon in your toolbar
2. Click **"New Project"**
3. Fill in: project name, current task, key decisions, links, and notes
4. Click **"Save"**

### Generating a Primer
1. Open a project from the dashboard
2. Click **"Generate Primer"**
3. The primer is automatically formatted and saved
4. Click **"Copy"** to copy it to your clipboard

### Relaying to an AI Agent
1. Go to ChatGPT, Claude, or Gemini
2. Click the floating **"Relay"** button (appears in the bottom-right corner)
3. Select a project from the list
4. The primer is injected into the chat input — press Enter to send

### Viewing History
- Click **"History"** in the top navigation
- See all primers across all projects, sorted by date
- Expand any primer to read the full content
- Click **"View"** to go to the project, or **"Copy"** to copy the primer

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser preview) |
| `npm run build` | Build extension to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run package` | Build and prepare for distribution |

### Adding New AI Platforms

1. Add a new content script in `src/content-scripts/`
2. Register it in `manifest.json` under `content_scripts`
3. Add the site's hostname and selectors to `src/lib/constants.ts`
4. Implement the injection logic in the new content script

---

## Roadmap

- [ ] **Cloud sync** — Supabase integration for cross-device primer access
- [ ] **Export** — download primers as markdown, JSON, or shareable links
- [ ] **Search / filter** — search across all primers by project or keyword
- [ ] **Tags** — Tag-based organization and filtering
- [ ] **Template library** — Pre-built primer templates for common workflows
- [ ] **More AI platforms** — Perplexity, Grok, Mistral, and others
- [ ] **Firefox/Edge** — Cross-browser support

---

## License

MIT