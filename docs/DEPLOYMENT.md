# Deployment Guide

This guide covers deploying all components of Context Relay.

## 1. Browser Extension

### Building for Distribution

```bash
npm install
npm run build
```

The `dist/` directory contains the complete extension:

```
dist/
├── manifest.json
├── index.html
├── popup.html
├── sidepanel.html
├── scripts/
│   ├── main.js
│   ├── sidepanel.js
│   ├── background.js
│   ├── content-chatgpt.js
│   ├── content-claude.js
│   ├── content-gemini.js
│   ├── content-perplexity.js
│   ├── content-grok.js
│   └── content-mistral.js
├── assets/
└── icons/
```

### Chrome Web Store

1. Create a ZIP of the `dist/` directory
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Click **New item**
4. Upload the ZIP file
5. Fill in the store listing:
   - **Description:** "Capture project context, generate AI primers, and relay them across ChatGPT, Claude, Gemini, and more."
   - **Screenshots:** Include screenshots of the dashboard, primer view, and relay panel
   - **Promotional images:** 440×280 tile, 1400×560 marquee
   - **Permissions justification:** Explain why `storage`, `tabs`, `sidePanel`, and host permissions are needed
6. Pay the one-time $5 developer registration fee (if not already registered)
7. Submit for review

### Manual Distribution (Sideloading)

For internal teams or testing:

1. Build the extension
2. Share the `dist/` folder or a ZIP of it
3. Recipients load it via `chrome://extensions` → **Load unpacked**

## 2. FastAPI Backend (Optional)

The backend provides AI-powered primer generation using Fireworks AI's GPT-OSS 120B model.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREWORKS_API_KEY` | Yes | Fireworks AI API key |
| `FIREWORKS_MODEL` | No | Model name (default: `accounts/fireworks/models/llama-v3p3-70b-instruct`) |
| `HOST` | No | Bind address (default: `0.0.0.0`) |
| `PORT` | No | Port (default: `8000`) |

### Docker Deployment (Recommended)

```bash
cd backend

docker build -t context-relay-backend:latest .

docker run -d \
  --name context-relay-backend \
  -p 8000:8000 \
  -e FIREWORKS_API_KEY="your-key-here" \
  --restart unless-stopped \
  context-relay-backend:latest
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - FIREWORKS_API_KEY=${FIREWORKS_API_KEY}
    restart: unless-stopped
```

### Cloud Deployment (Render / Fly.io)

#### Render
1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
4. Add the `FIREWORKS_API_KEY` environment variable
5. Deploy

#### Fly.io
```bash
cd backend
fly launch
fly secrets set FIREWORKS_API_KEY="your-key-here"
fly deploy
```

## 3. Supabase Edge Function (Alternative Backend)

### Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy generate-primer
```

### Environment Variables

Set these in the Supabase dashboard (or via CLI):

```bash
supabase secrets set FIREWORKS_API_KEY="your-key-here"
supabase secrets set FIREWORKS_MODEL="accounts/fireworks/models/llama-v3p3-70b-instruct"
```

### Update Extension Config

After deploying the backend, update the endpoint URL in `src/lib/constants.ts`:

```typescript
// Point to your deployed backend
export const PRIMER_GENERATOR_URL = "https://your-service.onrender.com/generate";
```

Then rebuild the extension:

```bash
npm run build
```

## 4. Updating the Extension

1. Make your changes
2. Update the version in `manifest.json` and `package.json`
3. Update `CHANGELOG.md`
4. Build: `npm run build`
5. For Chrome Web Store: create a new ZIP and upload as a new draft
6. Submit for review

## Ongoing Maintenance

- **DOM selectors:** AI platforms frequently update their UI. Monitor the content scripts and update selectors as needed.
- **API changes:** Both the Fireworks AI API and Supabase occasionally deprecate endpoints. Keep dependencies updated.
- **Permissions:** Chrome sometimes tightens extension permissions. Review the Manifest V3 compliance periodically.