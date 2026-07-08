import { useEffect, useState, useCallback } from "react";
import { useTheme } from "./context/ThemeContext";
import { getProjects, getPrimers, ensureSampleData } from "./lib/storage";
import type { Project, Primer } from "./types";

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

export default function AppSidepanel() {
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [primers, setPrimers] = useState<Primer[]>([]);
  const [expandedPrimerId, setExpandedPrimerId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [view, setView] = useState<"projects" | "primers">("projects");
  const [search, setSearch] = useState("");

  useEffect(() => {
    ensureSampleData().then(() => {
      getProjects().then(setProjects);
    });
  }, []);

  const openProject = useCallback(async (project: Project) => {
    setSelectedProject(project);
    const primerList = await getPrimers(project.id);
    setPrimers(primerList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setView("primers");
    setExpandedPrimerId(null);
  }, []);

  const handleCopy = useCallback(async (primer: Primer) => {
    try {
      await navigator.clipboard.writeText(primer.content);
      setCopiedId(primer.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = primer.content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(primer.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur-sm border-b border-border px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {view === "primers" ? (
            <button
              onClick={() => setView("projects")}
              className="p-1 rounded text-muted-fg hover:text-fg hover:bg-muted transition-all duration-150 cursor-pointer"
              aria-label="Back to projects"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <h1 className="text-sm font-semibold tracking-tight">
            {view === "primers" && selectedProject
              ? selectedProject.name
              : "Context Relay"}
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-muted-fg hover:text-fg hover:bg-muted transition-all duration-150 cursor-pointer"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
      </header>

      {/* Content */}
      <div className="p-3">
        {view === "projects" ? (
          <>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-fg placeholder:text-muted-fg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-150 mb-3 box-border"
            />

            {/* Project list */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-fg">No projects found</p>
                <p className="text-xs text-muted-fg mt-1">Open the popup to create one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p)}
                    className="w-full text-left p-3 rounded-xl bg-card border border-border hover:bg-card-hover hover:shadow-sm transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="font-medium text-sm text-fg truncate">{p.name}</div>
                    <div className="text-xs text-muted-fg mt-0.5 truncate">
                      {p.currentTask.slice(0, 100)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Primer list */}
            {primers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-fg">No primers yet</p>
                <p className="text-xs text-muted-fg mt-1">Open this project in the popup to generate one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {primers.map((primer) => (
                  <div key={primer.id}>
                    <button
                      onClick={() =>
                        setExpandedPrimerId(
                          expandedPrimerId === primer.id ? null : primer.id
                        )
                      }
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-card-hover transition-all duration-150 cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-fg whitespace-nowrap">
                          {relativeTime(primer.createdAt)}
                        </span>
                        <span className="text-xs text-muted-fg truncate">
                          {primer.content.slice(0, 60).replace(/\n/g, " ")}…
                        </span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`shrink-0 text-muted-fg transition-transform duration-200 ${
                          expandedPrimerId === primer.id ? "rotate-180" : ""
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {expandedPrimerId === primer.id && (
                      <div className="mt-1 ml-2 border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-muted-fg">Primer</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(primer);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-card border border-border text-muted-fg hover:text-fg hover:border-accent transition-all duration-150 cursor-pointer"
                          >
                            {copiedId === primer.id ? (
                              <>✓ Copied!</>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto text-fg">
                          {primer.content}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}