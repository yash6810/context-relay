import { ensureSampleData, getProjects, getProject, saveProject, deleteProject, getPrimers, getPrimer, savePrimer } from "./lib/storage";
import { PRIMER_GENERATOR_URL } from "./lib/constants";
import type { Project, Primer } from "./types";

// Initialize storage and sample data on install
chrome.runtime.onInstalled.addListener(async () => {
  // Set up side panel
  try {
    if (chrome.sidePanel) {
      await chrome.sidePanel.setOptions({
        path: "sidepanel.html",
        enabled: true,
      });

      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: false,
      });
    }
  } catch {
    // sidePanel API may not be available in all contexts
  }

  // Initialize sample data
  await ensureSampleData();

  // Create Context Menu for Auto-Scrape
  chrome.contextMenus.create({
    id: "scrape-context",
    title: "Add Page to Context Relay",
    contexts: ["page", "selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "scrape-context" && tab?.id) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // If user selected text, use that, otherwise scrape body
          const selection = window.getSelection()?.toString();
          if (selection && selection.trim()) return selection;
          
          // Fallback readability logic
          const clone = document.cloneNode(true) as Document;
          const badTags = ['script', 'style', 'nav', 'header', 'footer', 'noscript'];
          for (const tag of badTags) {
            clone.querySelectorAll(tag).forEach(e => e.remove());
          }
          return clone.body.innerText.replace(/\n{3,}/g, '\n\n').trim();
        }
      });
      
      const scrapedText = results[0].result;
      if (scrapedText) {
        // Create new project
        const newProject = {
          id: `proj-${Date.now()}`,
          name: tab.title || "Scraped Page",
          currentTask: "Review scraped context",
          keyDecisions: "",
          relevantLinks: tab.url || "",
          additionalNotes: scrapedText.slice(0, 5000), // Enforce limit
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveProject(newProject);
        
        // Open side panel
        if (chrome.sidePanel) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
        }
      }
    } catch (e) {
      console.error("Failed to scrape page", e);
    }
  }
});

// Handle messages from content scripts, popup, and side panel
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) =>
        sendResponse({ error: err instanceof Error ? err.message : String(err) })
      );
    return true; // Keep message channel open for async response
  }
);

async function handleMessage(message: { type: string; payload?: unknown }) {
  switch (message.type) {
    case "GET_STATS": {
      const allPrimers = await getPrimers();
      let savedTokens = 0;
      let localRuns = 0;
      allPrimers.forEach(p => {
        if (p.routing !== 'cloud') {
          localRuns++;
          savedTokens += Math.ceil(p.content.length / 4);
        }
      });
      const savedCost = (savedTokens / 1000000) * 0.20;
      return { savedTokens, savedCost, localRuns };
    }
    case "GET_PROJECTS": {
      const projects = await getProjects();
      return { projects };
    }
    case "GET_PROJECT": {
      const { id } = message.payload as { id: string };
      const project = await getProject(id);
      return { project };
    }
    case "SAVE_PROJECT": {
      const { project } = message.payload as { project: Project };
      await saveProject(project);
      return { success: true };
    }
    case "DELETE_PROJECT": {
      const { id } = message.payload as { id: string };
      await deleteProject(id);
      return { success: true };
    }
    case "GET_PRIMERS": {
      const { projectId } = message.payload as { projectId?: string };
      const primers = await getPrimers(projectId);
      return { primers };
    }
    case "GET_PRIMER": {
      const { id } = message.payload as { id: string };
      const primer = await getPrimer(id);
      return { primer };
    }
    case "SAVE_PRIMER": {
      const { primer } = message.payload as { primer: Primer };
      await savePrimer(primer);
      return { success: true };
    }
    case "OPEN_SIDE_PANEL": {
      try {
        if (chrome.sidePanel) {
          await chrome.sidePanel.open({});
        }
      } catch {
        // sidePanel may not be available
      }
      return { success: true };
    }

    // --- Conversation Capture: Generate Primer ---
    case "GENERATE_PRIMER": {
      const payload = message.payload as { text: string; project: Project };
      const { text, project } = payload;

      try {
        const primer = await generatePrimer(text, project);
        return { primer };
      } catch (err) {
        // Fallback: local compression
        return { primer: compressText(text) };
      }
    }

    // --- Conversation Capture: Migrate to another platform ---
    case "MIGRATE_PRIMER": {
      const { platform, url, text } = message.payload as {
        platform: string;
        url: string;
        text: string;
      };

      try {
        // Open the destination platform in a new tab
        const tab = await chrome.tabs.create({ url, active: true });

        // Wait for the tab to fully load, then inject
        await waitForTabComplete(tab.id!);

        // Send the primer text to the content script for injection
        await chrome.tabs.sendMessage(tab.id!, {
          type: "INJECT_PRIMER",
          payload: { text },
        });

        return { success: true };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Failed to open destination platform",
        };
      }
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

/**
 * Generate a primer from captured conversation text.
 * Uses the hybrid routing pipeline: tries the FastAPI backend first,
 * falls back to on-device compression.
 */
async function generatePrimer(text: string, project: Project): Promise<string> {
  // Try the backend API
  try {
    const response = await fetch(PRIMER_GENERATOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: project.name || "Captured Conversation",
        current_task: text,
        key_decisions: project.keyDecisions || "",
        relevant_links: project.relevantLinks || "",
        additional_notes: project.additionalNotes || "",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.primer) return data.primer;
    }
  } catch {
    // API unreachable — fall through to local
  }

  // Fallback: local compression
  return compressText(text);
}

/**
 * Compress text into a simple primer format (local fallback).
 */
function compressText(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const compressed = lines.map((l) => {
    if (l.length > 300) return l.slice(0, 300) + "...";
    return l;
  });

  return compressed.join("\n");
}

/**
 * Wait for a tab to finish loading, with timeout.
 */
function waitForTabComplete(tabId: number, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout waiting for tab to load"));
    }, timeoutMs);

    // Check if already complete
    chrome.tabs.get(tabId, (tab) => {
      if (tab.status === "complete") {
        clearTimeout(timeout);
        // Small extra delay for page scripts to initialize
        setTimeout(resolve, 1500);
        return;
      }
    });

    // Listen for tab update
    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        // Small extra delay for page scripts to initialize
        setTimeout(resolve, 1500);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}