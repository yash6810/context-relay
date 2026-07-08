import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProject, savePrimer, getPrimers } from "../lib/storage";
import type { Project, Primer } from "../types";

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

function formatPrimer(project: Project): string {
  const bulletLines = (text: string): string => {
    if (!text.trim()) return "• None";
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `• ${line}`)
      .join("\n");
  };

  const sections: string[] = [];
  sections.push(`PROJECT: ${project.name}`);
  sections.push("");
  sections.push("CURRENT TASK:");
  sections.push(project.currentTask || "—");
  sections.push("");
  sections.push("KEY DECISIONS:");
  sections.push(bulletLines(project.keyDecisions));
  sections.push("");
  sections.push("RELEVANT LINKS:");
  sections.push(bulletLines(project.relevantLinks));
  sections.push("");
  sections.push("ADDITIONAL NOTES:");
  sections.push(project.additionalNotes || "—");
  return sections.join("\n");
}

/* ── Export helpers ────────────────────────────── */

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsMarkdown(content: string, projectName: string) {
  const frontmatter = `# Primer: ${projectName}\n\n`;
  downloadFile(frontmatter + content, `${projectName.replace(/\s+/g, "-").toLowerCase()}-primer.md`, "text/markdown");
}

function exportAsJSON(content: string, projectName: string, createdAt: string) {
  const json = JSON.stringify({ project: projectName, createdAt, content }, null, 2);
  downloadFile(json, `${projectName.replace(/\s+/g, "-").toLowerCase()}-primer.json`, "application/json");
}

async function copyShareLink(primerId: string, projectName: string): Promise<boolean> {
  const url = `${window.location.origin}/projects/${primerId}?share=1`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}

/* ── Export dropdown ───────────────────────────── */

function ExportMenu({ content, projectName, primerId, createdAt }: { content: string; projectName: string; primerId: string; createdAt: string }) {
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleMarkdown = () => {
    exportAsMarkdown(content, projectName);
    setOpen(false);
  };
  const handleJSON = () => {
    exportAsJSON(content, projectName, createdAt);
    setOpen(false);
  };
  const handleShare = async () => {
    await copyShareLink(primerId, projectName);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-card border border-border text-muted-fg hover:text-fg hover:border-accent transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <button onClick={handleMarkdown} className="w-full text-left px-4 py-2.5 text-sm text-fg hover:bg-muted transition-colors duration-100 cursor-pointer flex items-center gap-2">
              <span className="text-xs">📝</span> Markdown (.md)
            </button>
            <button onClick={handleJSON} className="w-full text-left px-4 py-2.5 text-sm text-fg hover:bg-muted transition-colors duration-100 cursor-pointer flex items-center gap-2 border-t border-border">
              <span className="text-xs">📄</span> JSON (.json)
            </button>
            <button onClick={handleShare} className="w-full text-left px-4 py-2.5 text-sm text-fg hover:bg-muted transition-colors duration-100 cursor-pointer flex items-center gap-2 border-t border-border">
              <span className="text-xs">🔗</span> {linkCopied ? "Link copied!" : "Shareable link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── PrimerBlock ───────────────────────────────── */

function PrimerBlock({ primer, projectName }: { primer: Primer; projectName: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(primer.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = primer.content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [primer.content]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-muted-fg font-medium">
          {relativeTime(primer.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          <ExportMenu content={primer.content} projectName={projectName} primerId={primer.id} createdAt={primer.createdAt} />
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-card border border-border text-muted-fg hover:text-fg hover:border-accent transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto text-fg">
        {primer.content}
      </pre>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */

export default function PrimerView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPrimer, setShowPrimer] = useState(false);
  const [currentPrimerContent, setCurrentPrimerContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [primers, setPrimers] = useState<Primer[]>([]);

  // Load project
  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getProject(id).then((p) => {
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProject(p);
      setLoading(false);
    });
  }, [id]);

  // Load primers for this project
  useEffect(() => {
    if (!id) return;
    getPrimers(id).then((list) => {
      setPrimers(
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    });
  }, [id, showPrimer]);

  const handleGenerate = () => {
    if (!project) return;
    const content = formatPrimer(project);
    setCurrentPrimerContent(content);
    setShowPrimer(true);

    const now = new Date().toISOString();
    const newPrimer: Primer = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: project.id,
      content,
      createdAt: now,
    };
    savePrimer(newPrimer);
  };

  const handleCopyCurrent = async () => {
    if (!currentPrimerContent) return;
    try {
      await navigator.clipboard.writeText(currentPrimerContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = currentPrimerContent;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-fg">Loading project...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-1">Project not found</h2>
        <p className="text-muted-fg text-sm mb-6">
          This project doesn't exist or may have been deleted.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div>
      {/* Back link */}
      <div className="mb-6">
        <Link
          to="/"
          className="text-sm text-muted-fg hover:text-fg transition-colors duration-150 inline-flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Project header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-fg mt-1">
            Updated {relativeTime(project.updatedAt)}
          </p>
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-light text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          to={`/projects/${project.id}/edit`}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-fg border border-border font-medium text-sm hover:bg-muted transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          Edit
        </Link>
      </div>

      {/* Project context summary */}
      <div className="space-y-4 mb-10">
        <Section title="Current Task" icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="9" x2="15" y1="9" y2="15" />
            <line x1="15" x2="9" y1="9" y2="15" />
          </svg>
        }>
          <p className="text-sm whitespace-pre-wrap">{project.currentTask}</p>
        </Section>

        {project.keyDecisions && (
          <Section title="Key Decisions" icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          }>
            <p className="text-sm whitespace-pre-wrap">{project.keyDecisions}</p>
          </Section>
        )}

        {project.relevantLinks && (
          <Section title="Relevant Links" icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          }>
            <p className="text-sm whitespace-pre-wrap">{project.relevantLinks}</p>
          </Section>
        )}

        {project.additionalNotes && (
          <Section title="Additional Notes" icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          }>
            <p className="text-sm whitespace-pre-wrap">{project.additionalNotes}</p>
          </Section>
        )}
      </div>

      {/* Generate Primer section */}
      <div className="border-t border-border pt-8 mb-10">
        <h2 className="text-lg font-semibold mb-4">Primer Generator</h2>
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="m9 12 3 3 3-3" />
            <path d="M6 20h12" />
          </svg>
          Generate Primer
        </button>

        {showPrimer && currentPrimerContent && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium text-muted-fg">Generated Primer</p>
              <div className="flex items-center gap-2">
                <ExportMenu content={currentPrimerContent} projectName={project.name} primerId={"current"} createdAt={new Date().toISOString()} />
                <button
                  onClick={handleCopyCurrent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-card border border-border text-muted-fg hover:text-fg hover:border-accent transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto border border-border">
              {currentPrimerContent}
            </pre>
          </div>
        )}
      </div>

      {/* Per-project history section */}
      {primers.length > 0 && (
        <div className="border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-1">History</h2>
          <p className="text-sm text-muted-fg mb-4">
            {primers.length} {primers.length === 1 ? "primer" : "primers"} generated
          </p>
          <div className="space-y-3">
            {primers.map((primer) => (
              <div key={primer.id}>
                <button
                  onClick={() =>
                    setExpandedHistoryId(
                      expandedHistoryId === primer.id ? null : primer.id
                    )
                  }
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-card-hover transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                      className="shrink-0 text-muted-fg"
                    >
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    <span className="text-sm text-muted-fg whitespace-nowrap">
                      {relativeTime(primer.createdAt)}
                    </span>
                    <span className="text-sm text-muted-fg truncate hidden sm:inline">
                      {primer.content.slice(0, 80).replace(/\n/g, " ")}…
                    </span>
                  </div>
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
                    className={`shrink-0 text-muted-fg transition-transform duration-200 ${
                      expandedHistoryId === primer.id ? "rotate-180" : ""
                    }`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {expandedHistoryId === primer.id && (
                  <div className="mt-2 ml-4">
                    <PrimerBlock primer={primer} projectName={project.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent">{icon}</span>
        <h3 className="text-sm font-semibold text-muted-fg uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}