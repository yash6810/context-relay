import type { Project, Primer } from "../types";

interface RelayMessage {
  type: string;
  payload?: unknown;
}

const AI_PLATFORMS = [
  { id: "chatgpt", label: "ChatGPT", hostname: "chatgpt.com", url: "https://chatgpt.com" },
  { id: "claude", label: "Claude", hostname: "claude.ai", url: "https://claude.ai" },
  { id: "gemini", label: "Gemini", hostname: "gemini.google.com", url: "https://gemini.google.com" },
  { id: "perplexity", label: "Perplexity", hostname: "perplexity.ai", url: "https://perplexity.ai" },
  { id: "grok", label: "Grok", hostname: "grok.com", url: "https://grok.com" },
  { id: "mistral", label: "Mistral", hostname: "chat.mistral.ai", url: "https://chat.mistral.ai" },
];

function getCurrentPlatform(): string | null {
  const host = window.location.hostname;
  for (const p of AI_PLATFORMS) {
    if (host === p.hostname || host.endsWith("." + p.hostname)) return p.id;
  }
  return null;
}

async function sendMessage<T>(msg: RelayMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response as T);
    });
  });
}

function createContainer(): HTMLElement {
  const existing = document.getElementById("context-relay-root");
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = "context-relay-root";
  container.className = "cr-container";
  container.style.cssText = `
    all: initial;
    position: fixed;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  document.body.appendChild(container);
  return container;
}

function createStyles(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    .cr-btn {
      all: unset;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #4f46e5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .cr-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
    }
    .cr-btn:active {
      transform: scale(0.95);
    }
    .cr-btn svg {
      width: 22px;
      height: 22px;
    }
    .cr-panel {
      all: unset;
      position: fixed;
      bottom: 84px;
      right: 24px;
      z-index: 2147483647;
      width: 340px;
      max-height: 480px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
    }
    .cr-panel.open { display: flex; }
    .cr-panel-header {
      padding: 14px 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
    }
    .cr-panel-title {
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cr-panel-title svg {
      width: 16px;
      height: 16px;
    }
    .cr-close-btn {
      all: unset;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cr-close-btn:hover { background: #e5e7eb; color: #1a1a2e; }
    .cr-search {
      padding: 10px 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .cr-search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
    }
    .cr-search-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    }
    .cr-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .cr-list-empty {
      padding: 24px 16px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }
    .cr-project-item {
      all: unset;
      display: block;
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: 8px;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.15s;
      text-align: left;
    }
    .cr-project-item:hover { background: #f3f4f6; }
    .cr-project-name {
      font-weight: 500;
      font-size: 13px;
      color: #1a1a2e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cr-project-task {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cr-back-btn {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #4f46e5;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .cr-back-btn:hover { background: #eef2ff; }
    .cr-primer-item {
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      border: 1px solid #e5e7eb;
    }
    .cr-primer-item:hover { background: #f3f4f6; border-color: #4f46e5; }
    .cr-primer-date {
      font-size: 11px;
      color: #6b7280;
    }
    .cr-primer-preview {
      font-size: 12px;
      color: #374151;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: monospace;
    }
    .cr-inject-hint {
      font-size: 11px;
      color: #4f46e5;
      margin-top: 4px;
      font-weight: 500;
    }

    /* --- Capture button --- */
    .cr-capture-btn {
      all: unset;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: calc(100% - 32px);
      margin: 10px 16px 4px;
      padding: 10px 12px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      font-family: inherit;
    }
    .cr-capture-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    .cr-capture-btn:active {
      transform: scale(0.98);
    }
    .cr-capture-btn svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .cr-capture-btn.loading {
      opacity: 0.7;
      pointer-events: none;
    }
    .cr-capture-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 6px 16px 0;
    }

    /* --- Capture View --- */
    .cr-capture-success {
      text-align: center;
      padding: 16px 16px 8px;
    }
    .cr-capture-success-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #d1fae5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-size: 20px;
    }
    .cr-capture-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 2px;
    }
    .cr-capture-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .cr-platform-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      padding: 0 16px 12px;
    }
    .cr-platform-btn {
      all: unset;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 12px 6px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .cr-platform-btn:hover:not(:disabled) {
      background: #eef2ff;
      border-color: #4f46e5;
      transform: translateY(-1px);
    }
    .cr-platform-btn:active:not(:disabled) {
      transform: scale(0.97);
    }
    .cr-platform-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .cr-platform-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
    }
    .cr-platform-label {
      font-size: 10px;
      color: #374151;
      font-weight: 500;
    }
    .cr-save-hint {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      padding: 0 16px 12px;
    }
    .cr-capture-error {
      text-align: center;
      padding: 24px 16px;
      color: #ef4444;
      font-size: 13px;
    }
    .cr-capture-loading {
      text-align: center;
      padding: 24px 16px;
      color: #6b7280;
      font-size: 13px;
    }
    .cr-toast {
      position: fixed;
      bottom: 84px;
      right: 24px;
      z-index: 2147483647;
      background: #065f46;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: cr-fade-in 0.2s ease, cr-fade-out 0.3s ease 2s forwards;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    @keyframes cr-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes cr-fade-out {
      to { opacity: 0; transform: translateY(8px); }
    }

    /* --- Dark Mode --- */
    .cr-container.dark .cr-panel { background: #1a1a2e; color: #f3f4f6; }
    .cr-container.dark .cr-panel-header { background: #161626; border-bottom-color: #374151; }
    .cr-container.dark .cr-close-btn { color: #9ca3af; }
    .cr-container.dark .cr-close-btn:hover { background: #374151; color: #f3f4f6; }
    .cr-container.dark .cr-search { border-bottom-color: #374151; }
    .cr-container.dark .cr-search-input { background: #1a1a2e; border-color: #374151; color: #f3f4f6; }
    .cr-container.dark .cr-search-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2); }
    .cr-container.dark .cr-list-empty { color: #6b7280; }
    .cr-container.dark .cr-project-item:hover { background: #2d2d44; }
    .cr-container.dark .cr-project-name { color: #f3f4f6; }
    .cr-container.dark .cr-project-task { color: #9ca3af; }
    .cr-container.dark .cr-primer-item { border-color: #374151; }
    .cr-container.dark .cr-primer-item:hover { background: #2d2d44; border-color: #7c3aed; }
    .cr-container.dark .cr-primer-date { color: #9ca3af; }
    .cr-container.dark .cr-primer-preview { color: #d1d5db; }
    .cr-container.dark .cr-capture-divider { background: #374151; }
    .cr-container.dark .cr-capture-title { color: #f3f4f6; }
    .cr-container.dark .cr-platform-btn { background: #161626; border-color: #374151; }
    .cr-container.dark .cr-platform-btn:hover:not(:disabled) { background: #2d2d44; border-color: #7c3aed; }
    .cr-container.dark .cr-platform-label { color: #9ca3af; }
  `;
  return style;
}

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes === 1) return "1m ago";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours === 1) return "1h ago";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// --- SVG Icons ---

const RELAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`;
const RELAY_ICON_ALT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const BACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CAPTURE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

function platformColor(platformId: string): string {
  const colors: Record<string, string> = {
    chatgpt: "#10a37f",
    claude: "#d97757",
    gemini: "#4285f4",
    perplexity: "#6366f1",
    grok: "#1a1a2e",
    mistral: "#f59e0b",
  };
  return colors[platformId] || "#6b7280";
}

function platformAbbr(platformId: string): string {
  const abbrs: Record<string, string> = {
    chatgpt: "GPT",
    claude: "CLD",
    gemini: "GMN",
    perplexity: "PRP",
    grok: "GRK",
    mistral: "MST",
  };
  return abbrs[platformId] || "?";
}

// --- State ---

let currentView: "projects" | "primers" | "capture" = "projects";
let selectedProject: Project | null = null;
let projects: Project[] = [];
let primers: Primer[] = [];
let capturedText = "";
let capturedPrimer: string | null = null;
let capturedProjectId: string | null = null;
let captureCallback: (() => string) | null = null;

// --- Main injection ---

function injectRelayButton(inputSelectors: string[], captureFn?: () => string) {
  const container = createContainer();
  const style = createStyles();
  document.head.appendChild(style);

  captureCallback = captureFn || null;

  // Floating button
  const btn = document.createElement("button");
  btn.className = "cr-btn";
  btn.setAttribute("aria-label", "Open Context Relay");
  btn.innerHTML = RELAY_ICON;
  btn.onmouseenter = () => { btn.innerHTML = RELAY_ICON_ALT; };
  btn.onmouseleave = () => { btn.innerHTML = RELAY_ICON; };
  container.appendChild(btn);

  // Panel
  const panel = document.createElement("div");
  panel.className = "cr-panel";
  container.appendChild(panel);

  btn.addEventListener("click", async () => {
    if (panel.classList.contains("open")) {
      panel.classList.remove("open");
      return;
    }
    await loadProjects();
    renderProjectsView();
    panel.classList.add("open");
  });

  // Close panel when clicking outside
  document.addEventListener("click", (e) => {
    const path = e.composedPath();
    if (!path.includes(container) && !path.includes(btn)) {
      panel.classList.remove("open");
    }
  });

  // Setup theme listener
  const THEME_KEY = "context-relay-theme";
  chrome.storage.local.get(THEME_KEY, (res) => {
    if (res[THEME_KEY] === "dark") container.classList.add("dark");
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[THEME_KEY]) {
      if (changes[THEME_KEY].newValue === "dark") {
        container.classList.add("dark");
      } else {
        container.classList.remove("dark");
      }
    }
  });

  // Listen for injection from background (cross-tab migration)
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "INJECT_PRIMER") {
      const text = (msg.payload as { text: string })?.text || "";
      if (text) {
        // Retry injection every 500ms for up to 10 seconds to handle SPA loading
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          const injected = injectIntoChat(text);
          if (injected) {
            clearInterval(interval);
            showToast("Injected into " + (getCurrentPlatform() || "chat") + " ✓");
          } else if (attempts >= 20) {
            clearInterval(interval);
            showToast("Could not find chat input to inject into (timeout)");
          }
        }, 500);
        sendResponse({ success: true });
      } else {
        sendResponse({ error: "No primer text provided" });
      }
      return true;
    }
  });
}

async function loadProjects() {
  try {
    const response = await sendMessage<{ projects: Project[] }>({
      type: "GET_PROJECTS",
    });
    projects = response.projects;
  } catch {
    projects = [];
  }
}

async function loadPrimers(projectId: string) {
  try {
    const response = await sendMessage<{ primers: Primer[] }>({
      type: "GET_PRIMERS",
      payload: { projectId },
    });
    primers = response.primers;
  } catch {
    primers = [];
  }
}

function renderProjectsView() {
  currentView = "projects";
  selectedProject = null;
  const panel = document.querySelector(".cr-panel") as HTMLElement;
  if (!panel) return;

  const currentPlatform = getCurrentPlatform();
  const platformLabel = AI_PLATFORMS.find(p => p.id === currentPlatform)?.label || "this platform";

  let html = `
    <div class="cr-panel-header">
      <span class="cr-panel-title">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        Context Relay
      </span>
      <button class="cr-close-btn" id="cr-close-panel">${CLOSE_ICON}</button>
    </div>
  `;

  // Capture button
  html += `
    <button class="cr-capture-btn" id="cr-capture-btn">
      ${CAPTURE_ICON} Capture this conversation
    </button>
    <div class="cr-capture-divider"></div>
  `;

  html += `
    <div class="cr-search">
      <input class="cr-search-input" id="cr-search" placeholder="Search projects..." autocomplete="off" />
    </div>
    <div class="cr-list" id="cr-list">
  `;

  if (projects.length === 0) {
    html += `<div class="cr-list-empty">No projects yet. Click "Capture this conversation" to save context from ${platformLabel}, or open the extension to create a project manually.</div>`;
  } else {
    for (const p of projects) {
      html += `
        <button class="cr-project-item" data-id="${p.id}">
          <div class="cr-project-name">${escapeHtml(p.name)}</div>
          <div class="cr-project-task">${escapeHtml(p.currentTask.slice(0, 80))}</div>
        </button>
      `;
    }
  }

  html += `</div>`;
  panel.innerHTML = html;

  // Close button
  document.getElementById("cr-close-panel")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Capture button
  document.getElementById("cr-capture-btn")?.addEventListener("click", handleCapture);

  // Search
  document.getElementById("cr-search")?.addEventListener("input", (e) => {
    const q = (e.target as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll(".cr-project-item").forEach((item) => {
      const name = (item.querySelector(".cr-project-name")?.textContent || "").toLowerCase();
      (item as HTMLElement).style.display = name.includes(q) ? "block" : "none";
    });
  });

  // Project click
  document.querySelectorAll(".cr-project-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const id = (item as HTMLElement).dataset.id;
      if (!id) return;
      const proj = projects.find((p) => p.id === id);
      if (!proj) return;
      selectedProject = proj;
      await loadPrimers(id);
      renderPrimersView();
    });
  });
}

async function handleCapture() {
  const currentPlatform = getCurrentPlatform();
  const platformLabel = AI_PLATFORMS.find(p => p.id === currentPlatform)?.label || "this platform";

  // Try to capture via the provided callback
  let text = "";
  if (captureCallback) {
    text = captureCallback();
  }

  if (!text || text.trim().length < 10) {
    // Show error
    renderCaptureError("No conversation to capture. Start a conversation with " + platformLabel + " first.");
    return;
  }

  // Show loading state
  renderCaptureLoading();

  try {
    // Create project from captured text
    const projectId = `p-${Date.now()}`;
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const project: Project = {
      id: projectId,
      name: `Conversation — ${platformLabel} — ${dateStr}`,
      currentTask: text.slice(0, 150) + (text.length > 150 ? "..." : ""),
      keyDecisions: "",
      relevantLinks: "",
      additionalNotes: "",
      tags: ["captured", currentPlatform || ""],
      createdAt: now,
      updatedAt: now,
      icon: "💬",
    };

    // Save project
    await sendMessage({ type: "SAVE_PROJECT", payload: { project } });

    // Generate primer from captured text
    let primerContent = "";
    try {
      const response = await sendMessage<{ primer?: string; error?: string }>({
        type: "GENERATE_PRIMER",
        payload: { text, project },
      });
      primerContent = response.primer || formatPrimerText(text);
    } catch {
      primerContent = formatPrimerText(text);
    }

    // Save primer
    const primer: Primer = {
      id: `pr-${Date.now()}`,
      projectId,
      content: primerContent,
      createdAt: now,
    };
    await sendMessage({ type: "SAVE_PRIMER", payload: { primer } });

    // Store for capture view
    capturedText = text;
    capturedPrimer = primerContent;
    capturedProjectId = projectId;

    // Reload projects then show capture view
    await loadProjects();
    renderCaptureSuccess(platformLabel);
  } catch (err) {
    renderCaptureError("Could not save the captured conversation. Please try again.");
  }
}

function renderCaptureLoading() {
  currentView = "capture";
  const panel = document.querySelector(".cr-panel") as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="cr-panel-header">
      <button class="cr-back-btn" id="cr-back-capture">${BACK_ICON} Back</button>
      <span class="cr-panel-title" style="font-size:13px;">Capturing...</span>
      <button class="cr-close-btn" id="cr-close-panel">${CLOSE_ICON}</button>
    </div>
    <div class="cr-capture-loading">Reading conversation...</div>
  `;

  document.getElementById("cr-back-capture")?.addEventListener("click", () => renderProjectsView());
  document.getElementById("cr-close-panel")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });
}

function renderCaptureError(message: string) {
  currentView = "capture";
  const panel = document.querySelector(".cr-panel") as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="cr-panel-header">
      <button class="cr-back-btn" id="cr-back-capture">${BACK_ICON} Back</button>
      <span class="cr-panel-title" style="font-size:13px;">Capture</span>
      <button class="cr-close-btn" id="cr-close-panel">${CLOSE_ICON}</button>
    </div>
    <div class="cr-capture-error">${escapeHtml(message)}</div>
  `;

  document.getElementById("cr-back-capture")?.addEventListener("click", () => renderProjectsView());
  document.getElementById("cr-close-panel")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });
}

function renderCaptureSuccess(platformLabel: string) {
  currentView = "capture";
  const panel = document.querySelector(".cr-panel") as HTMLElement;
  if (!panel) return;

  const currentPlatform = getCurrentPlatform();

  // Build platform grid
  let gridHtml = "";
  for (const p of AI_PLATFORMS) {
    const isCurrent = p.id === currentPlatform;
    const color = platformColor(p.id);
    const abbr = platformAbbr(p.id);
    gridHtml += `
      <button class="cr-platform-btn" data-platform="${p.id}" ${isCurrent ? "disabled" : ""}>
        <div class="cr-platform-icon" style="background:${color}">${abbr}</div>
        <span class="cr-platform-label">${p.label}</span>
      </button>
    `;
  }

  panel.innerHTML = `
    <div class="cr-panel-header">
      <button class="cr-back-btn" id="cr-back-capture">${BACK_ICON} Back</button>
      <span class="cr-panel-title" style="font-size:13px;">Capture</span>
      <button class="cr-close-btn" id="cr-close-panel">${CLOSE_ICON}</button>
    </div>
    <div class="cr-list" style="overflow-y:auto;">
      <div class="cr-capture-success">
        <div class="cr-capture-success-icon">${CHECK_ICON}</div>
        <div class="cr-capture-title">Captured from ${platformLabel}</div>
        <div class="cr-capture-subtitle">${capturedText.split(/\s+/).length} words · primer ready</div>
      </div>
      <div style="padding:0 16px 8px;font-size:12px;font-weight:600;color:#374151;">Send to...</div>
      <div class="cr-platform-grid">
        ${gridHtml}
      </div>
      <div class="cr-save-hint">Saved to projects · close to inject later</div>
    </div>
  `;

  document.getElementById("cr-back-capture")?.addEventListener("click", () => renderProjectsView());
  document.getElementById("cr-close-panel")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Platform migration click
  document.querySelectorAll(".cr-platform-btn:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const platformId = (btn as HTMLElement).dataset.platform;
      if (!platformId || !capturedPrimer) return;

      const platform = AI_PLATFORMS.find(p => p.id === platformId);
      if (!platform) return;

      // Show a brief toast
      showToast("Opening " + platform.label + "...");

      // Tell background to migrate the primer
      try {
        if (capturedPrimer) {
          try {
            await navigator.clipboard.writeText(capturedPrimer);
          } catch (e) {
            console.warn("Could not write to clipboard", e);
          }
        }
        await sendMessage({
          type: "MIGRATE_PRIMER",
          payload: {
            platform: platformId,
            url: platform.url,
            text: capturedPrimer,
          },
        });
        showToast("Opened " + platform.label + " ✓");
      } catch {
        showToast("Could not open " + platform.label + " — try pasting manually");
      }
    });
  });
}

function renderPrimersView() {
  currentView = "primers";
  const panel = document.querySelector(".cr-panel") as HTMLElement;
  if (!panel || !selectedProject) return;

  let html = `
    <div class="cr-panel-header">
      <button class="cr-back-btn" id="cr-back">${BACK_ICON} Back</button>
      <span class="cr-panel-title" style="font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${escapeHtml(selectedProject.name)}
      </span>
      <button class="cr-close-btn" id="cr-close-panel">${CLOSE_ICON}</button>
    </div>
    <div class="cr-list" id="cr-list">
  `;

  if (primers.length === 0) {
    html += `<div class="cr-list-empty">No primers yet. Open the extension to generate one.</div>`;
  } else {
    for (const pr of primers) {
      const preview = pr.content.replace(/\n/g, " ").slice(0, 100);
      html += `
        <div class="cr-primer-item" data-id="${pr.id}">
          <div class="cr-primer-date">${relativeTime(pr.createdAt)}</div>
          <div class="cr-primer-preview">${escapeHtml(preview)}</div>
          <div class="cr-inject-hint">Click to inject into chat</div>
        </div>
      `;
    }
  }

  html += `</div>`;
  panel.innerHTML = html;

  document.getElementById("cr-back")?.addEventListener("click", () => renderProjectsView());
  document.getElementById("cr-close-panel")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  document.querySelectorAll(".cr-primer-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const id = (item as HTMLElement).dataset.id;
      if (!id) return;
      const primer = primers.find((p) => p.id === id);
      if (!primer) return;
      try {
        await navigator.clipboard.writeText(primer.content);
      } catch (e) {
        console.warn("Could not copy to clipboard", e);
      }
      injectIntoChat(primer.content);
      panel.classList.remove("open");
    });
  });
}

function injectIntoChat(text: string): boolean {
  const selectors = [
    "#prompt-textarea", // ChatGPT
    ".ProseMirror", // Claude
    '[contenteditable="true"]',
    "textarea",
    '[role="textbox"]',
  ];

  for (const sel of selectors) {
    const elements = document.querySelectorAll(sel);
    for (const elNode of elements) {
      const el = elNode as HTMLTextAreaElement | HTMLInputElement | HTMLElement;
      // Skip hidden or tiny elements
      if (el.offsetHeight === 0 && el.offsetWidth === 0) continue;
      // Skip elements that are clearly not the main chat input
      if (el.tagName !== "TEXTAREA" && el.tagName !== "INPUT" && el.getAttribute("contenteditable") !== "true" && el.getAttribute("role") !== "textbox" && !el.classList.contains("ProseMirror")) continue;

      try {
        el.focus();
        
        // Try React native value setter for textarea/input
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
          )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, text);
          } else {
            el.value = text;
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          
          if (el.value.includes(text.slice(0, 10))) return true;
        } else {
          // Contenteditable (ProseMirror, Draft.js, Lexical)
          
          // Ensure cursor is inside the element for execCommand to work
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // 1. Dispatch paste event
          const dataTransfer = new DataTransfer();
          dataTransfer.setData("text/plain", text);
          const pasteEvent = new ClipboardEvent("paste", {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
          });
          el.dispatchEvent(pasteEvent);

          // 2. Fallback to execCommand if paste wasn't handled or didn't insert text
          if (!el.textContent?.includes(text.slice(0, 10))) {
            document.execCommand("insertText", false, text);
          }
          
          // 3. Last resort
          if (!el.textContent?.includes(text.slice(0, 10))) {
            el.textContent = text;
          }

          el.dispatchEvent(new Event("input", { bubbles: true }));
          
          // Verify
          if (el.textContent?.includes(text.slice(0, 10))) return true;
        }
      } catch {
        continue;
      }
    }
  }
  return false;
}

function formatPrimerText(text: string): string {
  // Simple compression: truncate long lines, deduplicate whitespace
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const compressed = lines.map(l => {
    if (l.length > 200) return l.slice(0, 200) + "...";
    return l;
  }).join("\n");
  return compressed;
}

function showToast(message: string) {
  const existing = document.querySelector(".cr-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "cr-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 2500);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Examine page and inject ---
export function initRelay(inputSelectors: string[], captureConversation?: () => string) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => injectRelayButton(inputSelectors, captureConversation));
  } else {
    setTimeout(() => injectRelayButton(inputSelectors, captureConversation), 1500);
  }
  
  // Drift Detector Check (every 10 seconds)
  setInterval(async () => {
    // Only check if we have primers loaded in this tab context
    if (primers.length === 0) return;
    
    let text = "";
    for (const sel of inputSelectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        text += (el.innerText || el.textContent || (el as HTMLInputElement).value || "") + " ";
      }
    }
    if (text.length > 50) {
      // Find latest primer we might have injected
      const latestPrimer = primers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (latestPrimer) {
        // Simple overlap check
        const primerWords = new Set(latestPrimer.content.toLowerCase().split(/\W+/));
        const typedWords = new Set(text.toLowerCase().split(/\W+/));
        let overlap = 0;
        for (const w of typedWords) {
          if (w.length > 4 && primerWords.has(w)) overlap++;
        }
        if (overlap === 0 && typedWords.size > 20) {
          showToast("Context drift detected! Consider generating a new primer.");
        }
      }
    }
  }, 10000);
}