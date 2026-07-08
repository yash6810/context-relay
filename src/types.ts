export interface Project {
  id: string;
  name: string;
  currentTask: string;
  keyDecisions: string;
  relevantLinks: string;
  additionalNotes: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface Primer {
  id: string;
  projectId: string;
  content: string; // the generated primer text
  createdAt: string; // ISO date
}