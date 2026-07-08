import { ensureSampleData, getProjects, getProject, saveProject, deleteProject, getPrimers, getPrimer, savePrimer } from "./lib/storage";
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
    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}