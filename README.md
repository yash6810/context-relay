# Context Relay

> **Never lose your AI context again. Capture, organize, and relay project context across ChatGPT, Claude, Gemini, Perplexity, Grok, and Mistral — instantly.**

Context Relay is a browser extension that saves you from the endless cycle of re-explaining your project every time you switch AI assistants. Define your project context once, generate a structured "primer," and inject it into any supported AI chat with a single click.

---

## The Problem

You work across multiple AI tools — ChatGPT for brainstorming, Claude for deep analysis, Gemini for research, Perplexity for discovery, Grok for real-time data. Every time you switch, you have to re-explain:

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
- Create and organize projects with full context: current task, key decisions, relevant links, notes, and tags
- Edit and update projects as your context evolves
- Clean card-based dashboard with search, tag filtering, and sorting

### 📝 Primer Generation
- Generate structured, formatted primers from your project context
- Primers are saved with timestamps and version history
- Expandable card view for reading full primers
- One-click copy to clipboard

### 🔗 Cross-Platform Relay
- **ChatGPT** — Floating relay button on chatgpt.com
- **Claude** — Floating relay button on claude.ai
- **Gemini** — Floating relay button on gemini.google.com
- **Perplexity** — Floating relay button on perplexity.ai
- **Grok** — Floating relay button on grok.com
- **Mistral** — Floating relay button on chat.mistral.ai
- Select a project and inject its primer directly into the chat input

### 🔍 Search / Filter
- Search across all primers by project or keyword
- Instant filtering as you type
- Tag-based filtering on the dashboard
- Filter primers by project on the History page

### 📥 Export
- Download individual primers as Markdown (.md) or JSON (.json)
- Export all primers at once from the History page
- Copy shareable links to individual primers

### 🏷️ Tags
- Add comma-separated tags to any project
- Filter projects by tag on the dashboard
- Color-coded tags for quick visual scanning

### 📋 Template Library
- Pre-built project templates for common workflows
- Templates for: Web Apps, Mobile Apps, REST APIs, Browser Extensions, Landing Pages, AI Agents
- Quick-start any project from a template with placeholder fields

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
│  ┌──────────┬───────────┬────────────┬───────┐   │
│  │ ChatGPT  │  Claude   │   Gemini   │  ...  │   │
│  └──────────┴───────────┴────────────┴───────┘   │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 18 + TypeScript |
| **Styling** | TailwindCSS v4 with design tokens |
| **Routing** | React Router v7 (HashRouter) |
| **Build Tool** | Vite 7 (multi-entry build) |
| **Extension** | Manifest V3 (Chrome, Edge, Firefox) |
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
│   ├── perplexity.ts
│   ├── grok.ts
│   ├── mistral.ts
│   └── shared.ts       # Shared content script logic
├── lib/                # Utilities and data layer
│   ├── constants.ts    # Site selectors, config, templates
│   ├── storage.ts      # Async storage with caching layer
│   └── sample-data.ts  # Demo data with tags
├── pages/              # Route pages
│   ├── Dashboard.tsx   # Project list with search, tags, templates
│   ├── ProjectForm.tsx # Create/edit project with tags
│   ├── PrimerView.tsx  # Per-project primer with export
│   └── GlobalHistory.tsx # All primers with search, filter, export
├── App.tsx             # Route definitions
├── AppSidepanel.tsx    # Side panel with search + export
├── main.tsx            # Popup entry
├── main-sidepanel.tsx  # Side panel entry
├── background.ts       # Service worker
├── types.ts            # TypeScript types
└── index.css           # Global styles + Tailwind theme tokens
```

---

## Installation

### Chrome / Edge / Firefox

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
2. Click **"New Project"** (or "Templates" to start from a template)
3. Fill in: project name, current task, key decisions, links, notes, and tags
4. Click **"Save"**

### Generating a Primer
1. Open a project from the dashboard
2. Click **"Generate Primer"**
3. The primer is automatically formatted and saved
4. Click **"Copy"** to copy it to your clipboard, or **"Export"** to download

### Relaying to an AI Agent
1. Go to ChatGPT, Claude, Gemini, Perplexity, Grok, or Mistral
2. Click the floating **"Relay"** button (appears in the bottom-right corner)
3. Select a project from the list
4. The primer is injected into the chat input — press Enter to send

### Searching & Filtering
- Use the search bar on the Dashboard to find projects by name, task, or tag
- Click tag buttons to filter projects by tag
- On the History page, search primers by keyword or filter by project

### Exporting Primers
- On a project's page, click **"Export"** on any primer to download as Markdown or JSON
- On the History page, click **"Export All"** to export all visible primers at once
- Copy a shareable link to any individual primer

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
3. Add it to `vite.config.ts` rollup inputs
4. Add the site's hostname and selectors to `src/lib/constants.ts`

---

## Roadmap

- [ ] **Cloud sync** — Supabase integration for cross-device primer access

---

## License

MIT