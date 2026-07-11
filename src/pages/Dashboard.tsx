import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProjects } from "../lib/storage";
import { TEMPLATES } from "../lib/constants";
import type { Project, ProjectTemplate } from "../types";

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function ProjectCard({ project }: { project: Project }) {
  const taskPreview =
    project.currentTask.length > 100
      ? project.currentTask.slice(0, 100) + "…"
      : project.currentTask;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-card border border-border rounded-xl p-5 shadow-sm hover:bg-card-hover hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold text-fg truncate">{project.name}</h3>
        <span className="shrink-0 text-xs text-muted-fg whitespace-nowrap">
          {relativeTime(project.updatedAt)}
        </span>
      </div>
      {taskPreview && (
        <p className="mt-2 text-sm text-muted-fg line-clamp-1">{taskPreview}</p>
      )}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function TemplateModal({
  templates,
  onSelect,
  onClose,
}: {
  templates: ProjectTemplate[];
  onSelect: (template: ProjectTemplate) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Start from Template</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-fg hover:text-fg hover:bg-muted transition-all duration-150 cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full text-left p-4 rounded-xl bg-card border border-border hover:bg-card-hover hover:shadow-sm transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-fg">{t.name}</div>
                  <div className="text-xs text-muted-fg mt-0.5">{t.description}</div>
                  {t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.map((tag) => (
                        <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tagColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    getProjects().then((all) => {
      setProjects(
        all.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
      setLoading(false);
    });
  }, []);

  // Collect all unique tags across projects
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const p of projects) {
      for (const t of p.tags || []) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [projects]);

  // Filter projects by search query and selected tags
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.currentTask.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedTags.length > 0) {
      list = list.filter((p) =>
        selectedTags.some((t) => p.tags?.includes(t))
      );
    }
    return list;
  }, [projects, searchQuery, selectedTags]);

  const handleTemplateSelect = (t: ProjectTemplate) => {
    setShowTemplates(false);
    navigate("/projects/new", { state: { template: t } });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-fg">Loading projects...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-transparent text-fg border border-border font-medium text-sm hover:bg-muted active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Templates
          </button>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New Project
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, task, or tag..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-card text-fg placeholder:text-muted-fg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-150 box-border"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-fg hover:text-fg transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                selectedTags.includes(tag)
                  ? "bg-accent text-white ring-2 ring-accent/30"
                  : `${tagColor(tag)} hover:opacity-80`
              }`}
            >
              {tag}
              {selectedTags.includes(tag) && (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              )}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-muted-fg hover:text-fg transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Project list or empty state */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-light mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">
            {searchQuery || selectedTags.length > 0 ? "No matching projects" : "No projects yet"}
          </h2>
          <p className="text-muted-fg text-sm mb-6 max-w-xs mx-auto">
            {searchQuery || selectedTags.length > 0
              ? "Try a different search or clear your filters."
              : "Create your first project to save context and generate primers."}
          </p>
          {!searchQuery && selectedTags.length === 0 && (
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Create your first project
              </Link>
              <button
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-transparent text-fg border border-border font-medium text-sm hover:bg-muted active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Start from template
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Template modal */}
      {showTemplates && (
        <TemplateModal
          templates={TEMPLATES}
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}