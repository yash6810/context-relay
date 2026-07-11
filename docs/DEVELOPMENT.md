# Development Guide

## Prerequisites

- Node.js 20+
- npm 9+
- Chrome (or Edge, Firefox) for extension testing

## Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/context-relay.git
cd context-relay

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser. The app loads with sample data so you can test project management, primer generation, and history features without needing the extension.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   └── Layout.tsx        # App layout with header, nav, dark mode toggle
├── context/              # React context providers
│   ├── AuthContext.tsx    # Authentication state
│   └── ThemeContext.tsx   # Dark/light theme state
├── content-scripts/      # Per-platform injected scripts (see below)
│   ├── chatgpt.ts
│   ├── claude.ts
│   ├── gemini.ts
│   ├── perplexity.ts
│   ├── grok.ts
│   ├── mistral.ts
│   └── shared.ts         # Shared relay panel logic
├── lib/                  # Utilities
│   ├── constants.ts      # Site config, selectors, templates
│   ├── storage.ts        # Async storage (chrome.storage / localStorage)
│   ├── sample-data.ts    # Demo data for development
│   ├── supabase.ts       # Supabase client
│   └── sync.ts           # Cross-device sync
├── pages/                # Route page components
│   ├── Dashboard.tsx
│   ├── ProjectForm.tsx
│   ├── PrimerView.tsx
│   ├── GlobalHistory.tsx
│   └── AuthPage.tsx
├── App.tsx               # Route definitions (HashRouter)
├── AppSidepanel.tsx      # Side panel component
├── main.tsx              # Popup entry point
├── main-sidepanel.tsx    # Side panel entry point
├── background.ts         # Service worker
├── types.ts              # Shared TypeScript types
└── index.css             # TailwindCSS v4 theme + base styles
scripts/
└── build-content-scripts.js   # esbuild bundler for content scripts
backend/                  # FastAPI backend (optional)
├── main.py
├── Dockerfile
├── .dockerignore
└── requirements.txt
supabase/
└── functions/
    └── generate-primer/  # Supabase Edge Function (optional)
        └── index.ts
```

## Working with the Extension

### Building

```bash
npm run build
```

This runs two steps:
1. **Vite** builds the main app, popup, side panel, and background worker into `dist/`
2. **esbuild** builds each content script as a standalone IIFE into `dist/scripts/`

### Loading the Extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development Workflow

#### Previewing UI Changes
Run `npm run dev` and open `http://localhost:5173`. The app works as a standalone web app — all storage uses `localStorage` as a fallback, so you can iterate on UI without reloading the extension.

#### Testing Content Scripts
1. Build the extension with `npm run build`
2. Reload the extension in `chrome://extensions`
3. Navigate to the target AI platform (e.g., chatgpt.com)
4. Reload the page
5. The floating relay button should appear

#### Debugging Content Scripts
1. Right-click the AI platform page → **Inspect**
2. Open the **Console** tab
3. Content script logs will appear here
4. Use the **Sources** tab to set breakpoints in the content script code

#### Debugging the Background Service Worker
1. Go to `chrome://extensions`
2. Find Context Relay and click **service worker** (under "Inspection views")
3. A DevTools window opens for the background script

## Working with Content Scripts

Each content script must be a **standalone IIFE** — no ES module imports, no shared chunks. This is because Chrome content scripts execute in an isolated JavaScript environment.

### Adding a Content Script

1. Create a new file at `src/content-scripts/<platform>.ts`
2. Register it in `manifest.json` under `content_scripts`
3. Add it to the platforms array in `scripts/build-content-scripts.js`
4. Add the site's hostname to `src/lib/constants.ts`

### DOM Selectors

Each content script needs platform-specific selectors for:
- **Relay button injection point** — where to append the floating relay button
- **Chat input** — where to inject the primer text
- **Conversation capture** — selectors to read messages from the DOM (`captureConversation()`)

Selectors are platform-specific and may need updating when the target platform changes its DOM structure.

## Working with the Backend

The FastAPI backend is optional — the extension works fully offline using local markdown compression.

### Local Backend Development

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set your Fireworks AI key
export FIREWORKS_API_KEY="your-key-here"

# Run the server
python main.py
```

The server starts on `http://localhost:8000`.

### Docker

```bash
cd backend
docker build -t context-relay-backend .
docker run -p 8000:8000 -e FIREWORKS_API_KEY="your-key-here" context-relay-backend
```

## Testing

Currently, testing is manual. The project uses TypeScript for type safety, and the `npm run build` command catches most integration issues.

## Design Tokens

All colors, spacing, and typography are defined as TailwindCSS v4 theme tokens in `src/index.css`. Use them instead of ad-hoc values:

```tsx
<button className="bg-accent text-white px-5 py-2.5 rounded-lg font-medium
                   hover:bg-accent-hover active:scale-[0.97] transition-all duration-150">
  Generate Primer
</button>
```

**Never use raw color values.** If you need a new token, add it to the `@theme` block in `src/index.css` and update `docs/design-system/MASTER.md`.