import { useState, useEffect, useCallback } from "react";
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

/* ── types ───────────────────────────────────── */

interface PrimerWithProject extends Primer {
  projectName: string;
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
      <div className="flex items-center justify-between mb-6">
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
      ) : (
        <div className="space-y-5">
          {primersWithProjects.map((primer) => (
            <PrimerCard
              key={primer.id}
              primer={primer}
              projectId={primer.projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}