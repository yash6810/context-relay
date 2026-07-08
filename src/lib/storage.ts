import type { Project, Primer } from "../types";
import { SAMPLE_PROJECTS, SAMPLE_PRIMERS } from "./sample-data";

const PROJECTS_KEY = "context-relay-projects";
const PRIMERS_KEY = "context-relay-primers";
const INITIALIZED_KEY = "context-relay-initialized";

let cachedProjects: Project[] | null = null;
let cachedPrimers: Primer[] | null = null;

// --- Detect if we're in a Chrome extension context ---
function isExtensionContext(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage?.local;
}

// --- Chrome storage helpers ---

function getFromChrome<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] ?? null);
    });
  });
}

function setInChrome(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

// --- Unified read/write with caching ---

async function readFromStorage<T>(key: string): Promise<T[]> {
  if (isExtensionContext()) {
    const data = await getFromChrome<T[]>(key);
    return data ?? [];
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function writeToStorage<T>(key: string, value: T[]): Promise<void> {
  if (isExtensionContext()) {
    await setInChrome(key, value);
  } else {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to write to storage key "${key}":`, e);
    }
  }
}

// --- Initialize sample data ---

export async function ensureSampleData(): Promise<void> {
  if (isExtensionContext()) {
    const initialized = await getFromChrome<boolean>(INITIALIZED_KEY);
    if (initialized) return;
    const existing = await readFromStorage<Project>(PROJECTS_KEY);
    if (existing.length > 0) return;
    await setInChrome(PROJECTS_KEY, SAMPLE_PROJECTS);
    await setInChrome(PRIMERS_KEY, SAMPLE_PRIMERS);
    await setInChrome(INITIALIZED_KEY, true);
  } else {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    if (initialized) return;
    const existing = await readFromStorage<Project>(PROJECTS_KEY);
    if (existing.length > 0) return;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(SAMPLE_PROJECTS));
    localStorage.setItem(PRIMERS_KEY, JSON.stringify(SAMPLE_PRIMERS));
    localStorage.setItem(INITIALIZED_KEY, "true");
  }
}

// --- Projects ---

export async function getProjects(): Promise<Project[]> {
  if (cachedProjects) return cachedProjects;
  const projects = await readFromStorage<Project>(PROJECTS_KEY);
  cachedProjects = projects;
  return projects;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id);
}

export async function saveProject(project: Project): Promise<void> {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  cachedProjects = projects;
  await writeToStorage(PROJECTS_KEY, projects);
}

export async function deleteProject(id: string): Promise<void> {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  cachedProjects = filtered;
  await writeToStorage(PROJECTS_KEY, filtered);
  // Also delete associated primers
  const primers = await getPrimers();
  const filteredPrimers = primers.filter((p) => p.projectId !== id);
  cachedPrimers = filteredPrimers;
  await writeToStorage(PRIMERS_KEY, filteredPrimers);
}

// --- Primers ---

export async function getPrimers(projectId?: string): Promise<Primer[]> {
  const all = cachedPrimers ?? (await readFromStorage<Primer>(PRIMERS_KEY));
  cachedPrimers = all;
  if (projectId) {
    return all.filter((p) => p.projectId === projectId);
  }
  return all;
}

export async function getPrimer(id: string): Promise<Primer | undefined> {
  const all = await getPrimers();
  return all.find((p) => p.id === id);
}

export async function savePrimer(primer: Primer): Promise<void> {
  const primers = await getPrimers();
  primers.push(primer);
  cachedPrimers = primers;
  await writeToStorage(PRIMERS_KEY, primers);
}