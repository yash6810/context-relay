export interface Project {
  id: string;
  name: string;
  currentTask: string;
  keyDecisions: string;
  relevantLinks: string;
  additionalNotes: string;
  tags: string[]; // tag-based organization
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface Primer {
  id: string;
  projectId: string;
  content: string; // the generated primer text
  createdAt: string; // ISO date
  routing?: "local" | "cloud"; // which path was taken during generation
  modelUsed?: string; // the model/classifier used
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentTask: string;
  keyDecisions: string;
  relevantLinks: string;
  additionalNotes: string;
  tags: string[];
}

export type AIPlatform = "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "mistral";

export const AI_PLATFORMS: { id: AIPlatform; name: string; url: string; hostname: string }[] = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com", hostname: "chatgpt.com" },
  { id: "claude", name: "Claude", url: "https://claude.ai", hostname: "claude.ai" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com", hostname: "gemini.google.com" },
  { id: "perplexity", name: "Perplexity", url: "https://perplexity.ai", hostname: "perplexity.ai" },
  { id: "grok", name: "Grok", url: "https://grok.com", hostname: "grok.com" },
  { id: "mistral", name: "Mistral", url: "https://chat.mistral.ai", hostname: "chat.mistral.ai" },
];