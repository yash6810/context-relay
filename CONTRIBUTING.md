# Contributing to Context Relay

Thanks for your interest in contributing! Here's how to get started.

## Code of Conduct

This project follows a standard [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/context-relay.git`
3. Set up the development environment:

```bash
npm install
npm run dev
```

4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Project Structure

```
src/
├── components/          # Shared UI components
├── context/             # React context providers (theme, auth)
├── content-scripts/     # Per-platform injected scripts (ChatGPT, Claude, etc.)
├── lib/                 # Utilities, storage, constants
├── pages/               # Route-level page components
├── App.tsx              # Route definitions
├── AppSidepanel.tsx     # Side panel entry (no routing)
├── background.ts        # Chrome service worker
├── main.tsx             # Popup entry point
├── main-sidepanel.tsx   # Side panel entry point
├── types.ts             # Shared TypeScript types
└── index.css            # TailwindCSS v4 theme tokens
scripts/
└── build-content-scripts.js  # esbuild bundler for content scripts
backend/                 # FastAPI primer generation backend
├── main.py
├── Dockerfile
└── requirements.txt
supabase/
└── functions/
    └── generate-primer/  # Supabase Edge Function (alternative backend)
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser preview) |
| `npm run build` | Build extension + content scripts to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run package` | Build and prepare for distribution |

### Chrome Extension Build

The build is a two-step process:

1. **Vite** builds the popup, side panel, background service worker, and main app
2. **esbuild** independently bundles each content script as a self-contained IIFE

This is required because Chrome content scripts cannot use ES module `import` syntax.

### Code Quality

- TypeScript strict mode is enabled
- No unused locals or parameters (`noUnusedLocals`, `noUnusedParameters`)
- Design tokens from `src/index.css` are used instead of ad-hoc colors
- All PRs must pass the build step

## Pull Request Process

1. Ensure your code builds: `npm run build`
2. Update documentation if you're adding or changing features
3. Open a PR against the `main` branch with a clear title and description
4. Reference any related issues in the PR description

## Adding a New AI Platform

1. Create a content script at `src/content-scripts/<platform>.ts`
2. Register it in `manifest.json` under `content_scripts`
3. Add it to the platforms array in `scripts/build-content-scripts.js`
4. Add the site's hostname and selectors to `src/lib/constants.ts`
5. Add the platform URL/name mapping to the relay panel in `shared.ts`

## Style Guide

- **UI:** Use the design system tokens (`bg-accent`, `text-fg`, etc.) — never hardcode colors
- **Icons:** Use `lucide-react` for generic UI icons; use `react-icons/si` for brand/social logos
- **CSS:** TailwindCSS v4 utility classes only — no custom CSS files
- **Components:** One component per file, exported as named export
- **Types:** Shared types go in `src/types.ts`

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).