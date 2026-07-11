import { supabase } from "./supabase";
import type { Project, Primer } from "../types";

// ─── Helper ───────────────────────────────────────────────────────────────────

function getUserId(user: import("@supabase/supabase-js").User | null): string {
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function syncProjectToCloud(
  project: Project,
  user: import("@supabase/supabase-js").User
): Promise<void> {
  const userId = getUserId(user);
  const { error } = await supabase.from("projects").upsert(
    {
      id: project.id,
      user_id: userId,
      name: project.name,
      current_task: project.currentTask,
      key_decisions: project.keyDecisions,
      relevant_links: project.relevantLinks,
      additional_notes: project.additionalNotes,
      tags: project.tags,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    },
    { onConflict: "user_id, id" }
  );
  if (error) console.error("Cloud sync error (project):", error);
}

export async function deleteProjectFromCloud(
  projectId: string,
  user: import("@supabase/supabase-js").User
): Promise<void> {
  const userId = getUserId(user);
  // Delete primers first
  await supabase
    .from("primers")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId);
  // Delete project
  await supabase
    .from("projects")
    .delete()
    .eq("user_id", userId)
    .eq("id", projectId);
}

export async function pullProjectsFromCloud(
  user: import("@supabase/supabase-js").User
): Promise<Project[]> {
  const userId = getUserId(user);
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Cloud pull error (projects):", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    currentTask: row.current_task,
    keyDecisions: row.key_decisions,
    relevantLinks: row.relevant_links,
    additionalNotes: row.additional_notes,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ─── Primers ──────────────────────────────────────────────────────────────────

export async function syncPrimerToCloud(
  primer: Primer,
  user: import("@supabase/supabase-js").User
): Promise<void> {
  const userId = getUserId(user);
  const { error } = await supabase.from("primers").upsert(
    {
      id: primer.id,
      user_id: userId,
      project_id: primer.projectId,
      content: primer.content,
      created_at: primer.createdAt,
    },
    { onConflict: "user_id, id" }
  );
  if (error) console.error("Cloud sync error (primer):", error);
}

export async function pullPrimersFromCloud(
  user: import("@supabase/supabase-js").User
): Promise<Primer[]> {
  const userId = getUserId(user);
  const { data, error } = await supabase
    .from("primers")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Cloud pull error (primers):", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    content: row.content,
    createdAt: row.created_at,
  }));
}

/** Merge remote data into local storage. Local data wins on conflict (newer updatedAt). */
export function mergeProjects(
  local: Project[],
  remote: Project[]
): Project[] {
  const map = new Map<string, Project>();
  for (const p of local) map.set(p.id, p);
  for (const p of remote) {
    const existing = map.get(p.id);
    if (!existing || new Date(p.updatedAt) > new Date(existing.updatedAt)) {
      map.set(p.id, p);
    }
  }
  return Array.from(map.values());
}

export function mergePrimers(
  local: Primer[],
  remote: Primer[]
): Primer[] {
  const seen = new Set<string>();
  const result: Primer[] = [];
  for (const p of [...local, ...remote]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      result.push(p);
    }
  }
  return result;
}