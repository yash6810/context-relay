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
    </div>
  );
}