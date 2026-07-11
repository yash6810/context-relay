import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPrimers, getProjects } from "../lib/storage";
import type { Primer, Project } from "../types";

/* ── helpers ─────────────────────────────────── */

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (s < 10) return "Just now";
  if (s < 60) return `${s}s ago`;
  if (m === 1) return "1m ago";
  if (m < 60) return `${m}m ago`;
  if (h === 1) return "1h ago";
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Export helpers ───────────────────────────── */

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── types ───────────────────────────────────── */

interface PrimerWithProject extends Primer {
  projectName: string;
}

/* ── Export all ───────────────────────────────── */

function ExportAllButton({ primers }: { primers: PrimerWithProject[] }) {
  const [open, setOpen] = useState(false);

  const handleMarkdownAll = () => {
    let combined = "# Context Relay — All Primers\n\n";
    primers.forEach((p) => {
      combined += `## ${p.projectName} (${formatDate(p.createdAt)})\n\n${p.content}\n\n---\n\n`;
    });
    downloadFile(combined, "all-primers.md", "text/markdown");
    setOpen(false);
  };

  const handleJSONAll = () => {
    const data = primers.map((p) => ({
      project: p.projectName,
      createdAt: p.createdAt,
      content: p.content,
    }));
    downloadFile(JSON.stringify(data, null, 2), "all-primers.json", "application/json");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Export All
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <button onClick={handleMarkdownAll} className="w-full text-left px-4 py-2.5 text-sm text-fg hover:bg-muted transition-colors duration-100 cursor-pointer flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-fg">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
              All as Markdown
            </button>
            <button onClick={handleJSONAll} className="w-full text-left px-4 py-2.5 text-sm text-fg hover:bg-muted transition-colors duration-100 cursor-pointer flex items-center gap-2 border-t border-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-fg">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              All as JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── PrimerCard ──────────────────────────────── */

const PROJECT_COLORS = [
  "bg-accent",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
] as const;

function projectColor(projectId: string): string {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash + projectId.charCodeAt(i)) | 0;
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function PrimerCard({
  primer,
  projectId,
}: {
  primer: PrimerWithProject;
  projectId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(primer.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = primer.content;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [primer.content]
  );

  const previewLines = primer.content.split("\n").slice(0, 6).join("\n");
  const hasMore = primer.content.split("\n").length > 6;

  return (
    <div
      className={`group bg-card border border-border rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${
        expanded ? "shadow-md" : "hover:shadow-md hover:bg-card-hover"
      }`}
    >
      {/* Accent stripe */}
      <div className={`h-1.5 ${projectColor(projectId)} w-full`} />

      {/* Card header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/projects/${primer.projectId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors duration-150 truncate max-w-[200px]"
            >
              {primer.projectName}
            </Link>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-light text-accent shrink-0">
              Primer
            </span>
          </div>
        </div>
        <time
          dateTime={primer.createdAt}
          className="shrink-0 text-xs text-muted-fg whitespace-nowrap"
          title={formatDate(primer.createdAt)}
        >
          {relativeTime(primer.createdAt)}
        </time>
      </div>

      {/* Primer content preview / full */}
      <div className="px-5 pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse primer" : "Expand primer"}
        >
          <pre
            className={`text-sm font-mono whitespace-pre-wrap overflow-x-auto text-fg leading-relaxed transition-all duration-200 ${
              expanded ? "max-h-none" : "max-h-36 overflow-y-hidden"
            }`}
          >
            {expanded ? primer.content : previewLines}
          </pre>
          {!expanded && (
            <div className="relative">
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
            </div>
          )}
        </button>
      </div>

      {/* Card footer — actions */}
      <div className="px-5 pb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-fg hover:text-fg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          {expanded ? "Show less" : hasMore ? "Show more" : "Expand"}
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${primer.projectId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-transparent border border-border text-muted-fg hover:text-fg hover:border-accent transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View
          </Link>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────── */

export default function GlobalHistory() {
  const [primersWithProjects, setPrimersWithProjects] = useState<
    PrimerWithProject[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    async function load() {
      const [allPrimers, projects] = await Promise.all([
        getPrimers(),
        getProjects(),
      ]);
      const projectMap = new Map(projects.map((p: Project) => [p.id, p.name]));

      const enriched: PrimerWithProject[] = allPrimers.map((p: Primer) => ({
        ...p,
        projectName: projectMap.get(p.projectId) || "Unknown Project",
      }));

      setPrimersWithProjects(
        enriched.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setLoading(false);
    }
    load();
  }, []);

  // Get unique project names for filter
  const projectNames = useMemo(() => {
    const names = new Set(primersWithProjects.map((p) => p.projectName));
    return Array.from(names).sort();
  }, [primersWithProjects]);

  // Filter primers
  const filteredPrimers = useMemo(() => {
    let list = primersWithProjects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
    }
    if (selectedProject) {
      list = list.filter((p) => p.projectName === selectedProject);
    }
    return list;
  }, [primersWithProjects, searchQuery, selectedProject]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4 animate-pulse">
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <p className="text-muted-fg text-sm">Loading history…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <div className="mb-6">
        <Link
          to="/"
          className="text-sm text-muted-fg hover:text-fg transition-colors duration-150 inline-flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Primer History
          </h1>
          {primersWithProjects.length > 0 && (
            <p className="text-sm text-muted-fg mt-1">
              {primersWithProjects.length}{" "}
              {primersWithProjects.length === 1 ? "primer" : "primers"} saved
              across all projects
            </p>
          )}
        </div>
        {filteredPrimers.length > 0 && (
          <ExportAllButton primers={filteredPrimers} />
        )}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
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
            placeholder="Search primers by keyword..."
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
        {projectNames.length > 1 && (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-border bg-card text-fg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-150 cursor-pointer"
            aria-label="Filter by project"
          >
            <option value="">All projects</option>
            {projectNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {primersWithProjects.length === 0 ? (
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
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">No primers yet</h2>
          <p className="text-muted-fg text-sm mb-6 max-w-xs mx-auto">
            Generate a primer from any project to save context you can reuse
            later.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
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
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      ) : filteredPrimers.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-lg font-semibold mb-1">No matching primers</h2>
          <p className="text-muted-fg text-sm">
            Try a different search or clear your filters.
          </p>
        </div>
      ) : (
        <>
          {searchQuery && (
            <p className="text-sm text-muted-fg mb-4">
              {filteredPrimers.length} result{filteredPrimers.length !== 1 ? "s" : ""} for "{searchQuery}"
              {selectedProject && <> in <strong>{selectedProject}</strong></>}
            </p>
          )}
          <div className="space-y-5">
            {filteredPrimers.map((primer) => (
              <PrimerCard
                key={primer.id}
                primer={primer}
                projectId={primer.projectId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}