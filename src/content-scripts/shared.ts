import type { Project, Primer } from "../types";

interface RelayMessage {
  type: string;
  payload?: unknown;
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

// --- State ---

let currentView: "projects" | "primers" = "projects";
let selectedProject: Project | null = null;
let projects: Project[] = [];
let primers: Primer[] = [];

// --- Main injection ---

function injectRelayButton(inputSelectors: string[]) {
  const container = createContainer();
  const style = createStyles();
  document.head.appendChild(style);

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
    const target = e.target as Node;
    if (!container.contains(target) && !btn.contains(target)) {
      panel.classList.remove("open");
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

  let html = `
    <div class="cr-panel-header">
      <span class="cr-panel-title">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        Context Relay
      </span>
      <button class="cr-close-btn" id="cr-close-panel">${CLOSE_ICON}</button>
    </div>
    <div class="cr-search">
      <input class="cr-search-input" id="cr-search" placeholder="Search projects..." autocomplete="off" />
    </div>
    <div class="cr-list" id="cr-list">
  `;

  if (projects.length === 0) {
    html += `<div class="cr-list-empty">No projects yet. Open the extension to create one.</div>`;
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

  // Back button
  document.getElementById("cr-back")?.addEventListener("click", () => {
    renderProjectsView();
  });

  // Close button
  document.getElementById("cr-close-panel")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Primer click → inject
  document.querySelectorAll(".cr-primer-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = (item as HTMLElement).dataset.id;
      if (!id) return;
      const primer = primers.find((p) => p.id === id);
      if (!primer) return;
      injectIntoChat(primer.content);
      panel.classList.remove("open");
    });
  });
}

function injectIntoChat(text: string) {
  // Try common input selectors for ChatGPT, Claude, Gemini
  const selectors = [
    "#prompt-textarea",           // ChatGPT
    '[contenteditable="true"]',   // Claude, Gemini
    "textarea",                   // Fallback
    '[role="textbox"]',           // Generic
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel) as
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLElement
      | null;
    if (!el) continue;

    try {
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      // contenteditable div
      if (el.getAttribute("contenteditable") === "true" || el.getAttribute("role") === "textbox") {
        el.focus();
        document.execCommand("insertText", false, text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
    } catch {
      continue;
    }
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Examine page and inject ---
export function initRelay(inputSelectors: string[]) {
  // Wait for page to settle
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => injectRelayButton(inputSelectors));
  } else {
    // Small delay to let the page fully render
    setTimeout(() => injectRelayButton(inputSelectors), 1500);
  }
}