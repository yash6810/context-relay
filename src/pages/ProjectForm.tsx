import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { getProject, saveProject } from "../lib/storage";
import { useTheme } from "../context/ThemeContext";
import type { ProjectTemplate } from "../types";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { theme } = useTheme();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [currentTask, setCurrentTask] = useState("");
  const [keyDecisions, setKeyDecisions] = useState("");
  const [relevantLinks, setRelevantLinks] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [errors, setErrors] = useState<{ name?: string; currentTask?: string }>({});
  const [loading, setLoading] = useState(isEdit);
  const [showReminder, setShowReminder] = useState(false);

  // 20-second save reminder
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReminder(true);
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  // Load template from navigation state or existing project
  useEffect(() => {
    const template = (location.state as { template?: ProjectTemplate })?.template;

    if (template) {
      setName(template.name.replace(/\[.*?\]/g, "").trim() || "");
      setCurrentTask(template.currentTask);
      setKeyDecisions(template.keyDecisions);
      setRelevantLinks(template.relevantLinks);
      setAdditionalNotes(template.additionalNotes);
      setTagsStr(template.tags.join(", "));
      setLoading(false);
      return;
    }

    if (!id) return;
    getProject(id).then((project) => {
      if (!project) {
        navigate("/", { replace: true });
        return;
      }
      setName(project.name);
      setCurrentTask(project.currentTask);
      setKeyDecisions(project.keyDecisions || "");
      setRelevantLinks(project.relevantLinks || "");
      setAdditionalNotes(project.additionalNotes || "");
      setTagsStr((project.tags || []).join(", "));
      setLoading(false);
    });
  }, [id, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Project name is required";
    if (!currentTask.trim()) newErrors.currentTask = "Current task is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const now = new Date().toISOString();
    const tags = tagsStr
      .split(/[,\n]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (isEdit && id) {
      const existing = await getProject(id);
      if (!existing) {
        navigate("/", { replace: true });
        return;
      }
      await saveProject({
        ...existing,
        name: name.trim(),
        currentTask: currentTask.trim(),
        keyDecisions: keyDecisions.trim(),
        relevantLinks: relevantLinks.trim(),
        additionalNotes: additionalNotes.trim(),
        tags,
        updatedAt: now,
      });
      navigate(`/projects/${id}`);
    } else {
      const projectId = generateId();
      await saveProject({
        id: projectId,
        name: name.trim(),
        currentTask: currentTask.trim(),
        keyDecisions: keyDecisions.trim(),
        relevantLinks: relevantLinks.trim(),
        additionalNotes: additionalNotes.trim(),
        tags,
        createdAt: now,
        updatedAt: now,
      });
      navigate(`/projects/${projectId}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-fg">Loading project...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        {isEdit ? "Edit Project" : "New Project"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Landing Page Redesign"
            className={`w-full px-4 py-2.5 rounded-lg border bg-card text-fg placeholder:text-muted-fg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-150 ${
              errors.name ? "border-destructive" : "border-border"
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-destructive text-sm mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Current Task */}
        <div data-color-mode={theme}>
          <label htmlFor="currentTask" className="block text-sm font-medium mb-1.5">
            Current Task <span className="text-destructive">*</span>
          </label>
          <div className={`${errors.currentTask ? "border border-destructive rounded-lg" : ""}`}>
            <MDEditor
              value={currentTask}
              onChange={(val) => {
                setCurrentTask(val || "");
                if (errors.currentTask) setErrors((prev) => ({ ...prev, currentTask: undefined }));
              }}
              height={200}
              preview="edit"
              textareaProps={{
                placeholder: "What are you working on right now?"
              }}
            />
          </div>
          {errors.currentTask && (
            <p id="task-error" className="text-destructive text-sm mt-1">
              {errors.currentTask}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1.5">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="e.g. web, backend, react (comma-separated)"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-fg placeholder:text-muted-fg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-150"
          />
          <p className="text-xs text-muted-fg mt-1">
            Comma-separated tags for filtering and organization
          </p>
        </div>

        {/* Key Decisions */}
        <div data-color-mode={theme}>
          <label htmlFor="keyDecisions" className="block text-sm font-medium mb-1.5">
            Key Decisions
          </label>
          <MDEditor
            value={keyDecisions}
            onChange={(val) => setKeyDecisions(val || "")}
            height={150}
            preview="edit"
            textareaProps={{
              placeholder: "Decisions made so far, with rationale..."
            }}
          />
        </div>

        {/* Relevant Links */}
        <div data-color-mode={theme}>
          <label htmlFor="relevantLinks" className="block text-sm font-medium mb-1.5">
            Relevant Links
          </label>
          <MDEditor
            value={relevantLinks}
            onChange={(val) => setRelevantLinks(val || "")}
            height={150}
            preview="edit"
            textareaProps={{
              placeholder: "One per line, or comma-separated URLs..."
            }}
          />
        </div>

        {/* Additional Notes */}
        <div data-color-mode={theme}>
          <label htmlFor="additionalNotes" className="block text-sm font-medium mb-1.5">
            Additional Notes
          </label>
          <MDEditor
            value={additionalNotes}
            onChange={(val) => setAdditionalNotes(val || "")}
            height={150}
            preview="edit"
            textareaProps={{
              placeholder: "Anything else that's useful context..."
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isEdit ? "Save Changes" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-lg bg-transparent text-fg border border-border font-medium text-sm hover:bg-muted transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
        </div>
      </form>

      {showReminder && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-card border border-border rounded-xl shadow-lg p-4 z-50 transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="text-warning shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-fg">Don't forget to save!</h4>
              <p className="text-xs text-muted-fg mt-1">You've been editing this context for a while. Make sure to save it so you don't lose your work.</p>
            </div>
            <button onClick={() => setShowReminder(false)} className="text-muted-fg hover:text-fg p-1 shrink-0 cursor-pointer rounded hover:bg-muted transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}