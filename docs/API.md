# API Reference

## Primer Generation API

Both the FastAPI backend and Supabase Edge Function expose the same API contract.

### `POST /generate`

Generates a structured AI primer from project context.

#### Request Body

```json
{
  "project_name": "My Project",
  "current_task": "Building a user authentication system with JWT tokens...",
  "key_decisions": "Using Supabase for auth, React Router for navigation",
  "relevant_links": "https://github.com/user/project\nhttps://figma.com/file/design",
  "additional_notes": "Target release: Q3 2026"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_name` | string | Yes | Name of the project |
| `current_task` | string | Yes | The captured conversation or task description |
| `key_decisions` | string | No | Key decisions made (default: empty string) |
| `relevant_links` | string | No | Related URLs (default: empty string) |
| `additional_notes` | string | No | Extra context (default: empty string) |

#### Response

```json
{
  "primer": "# Project: My Project\n\n## Current Task\nBuilding a user authentication system with JWT tokens...\n\n## Key Decisions\n- Using Supabase for auth\n- React Router for navigation\n\n## Relevant Links\n- https://github.com/user/project\n- https://figma.com/file/design\n\n## Notes\nTarget release: Q3 2026"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `primer` | string | The generated primer (Markdown-formatted) |

#### Error Response

```json
{
  "detail": "Error generating primer: [error message]"
}
```

Status codes:
- `200` — Success
- `422` — Validation error (missing required fields)
- `500` — Internal server error (API key missing, model error, etc.)

#### cURL Example

```bash
curl -X POST https://your-backend.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "My Project",
    "current_task": "Implementing OAuth login flow",
    "key_decisions": "Using Supabase for auth",
    "relevant_links": "",
    "additional_notes": ""
  }'
```

## Chrome Extension Message API

The extension uses `chrome.runtime.sendMessage` for internal communication between components. All messages follow this format:

```typescript
interface Message {
  type: string;
  payload?: unknown;
}
```

### Message Types

#### Storage Operations

| Type | Payload | Response | Description |
|------|---------|----------|-------------|
| `GET_PROJECTS` | — | `{ projects: Project[] }` | Get all projects |
| `GET_PROJECT` | `{ id: string }` | `{ project: Project }` | Get a single project |
| `SAVE_PROJECT` | `{ project: Project }` | `{ success: true }` | Save a project |
| `DELETE_PROJECT` | `{ id: string }` | `{ success: true }` | Delete a project |
| `GET_PRIMERS` | `{ projectId?: string }` | `{ primers: Primer[] }` | Get primers (optionally filtered by project) |
| `GET_PRIMER` | `{ id: string }` | `{ primer: Primer }` | Get a single primer |
| `SAVE_PRIMER` | `{ primer: Primer }` | `{ success: true }` | Save a primer |

#### Primer Generation

| Type | Payload | Response | Description |
|------|---------|----------|-------------|
| `GENERATE_PRIMER` | `{ text: string, project: Project }` | `{ primer: string }` | Generate a primer from captured text |

#### Cross-Platform Migration

| Type | Payload | Response | Description |
|------|---------|----------|-------------|
| `MIGRATE_PRIMER` | `{ platform: string, url: string, text: string }` | `{ success: true }` | Migrate primer to another platform |

#### UI Actions

| Type | Payload | Response | Description |
|------|---------|----------|-------------|
| `OPEN_SIDE_PANEL` | — | `{ success: true }` | Open the side panel |
| `INJECT_PRIMER` | `{ text: string }` | — | Injects primer text into the chat input |

### Message Flow Example

```typescript
// Popup sends to background
const response = await chrome.runtime.sendMessage({
  type: "GENERATE_PRIMER",
  payload: { text: conversationText, project },
});

// Background sends to content script
await chrome.tabs.sendMessage(tabId, {
  type: "INJECT_PRIMER",
  payload: { text: primerText },
});
```

## Local Storage API

For development without Chrome extension APIs, the storage layer falls back to `localStorage`.

### `src/lib/storage.ts`

```typescript
// Projects
getProjects(): Promise<Project[]>
getProject(id: string): Promise<Project | null>
saveProject(project: Project): Promise<void>
deleteProject(id: string): Promise<void>

// Primers
getPrimers(projectId?: string): Promise<Primer[]>
getPrimer(id: string): Promise<Primer | null>
savePrimer(primer: Primer): Promise<void>
```

## TypeScript Types

### `src/types.ts`

```typescript
interface Project {
  id: string;
  name: string;
  currentTask: string;
  keyDecisions: string;
  relevantLinks: string;
  additionalNotes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Primer {
  id: string;
  projectId: string;
  projectName: string;
  content: string;
  source: "local" | "cloud";
  model?: string;
  createdAt: string;
}
```