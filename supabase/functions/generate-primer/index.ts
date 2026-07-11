import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const MODEL = "accounts/fireworks/models/gemma-3-27b-it";

const SYSTEM_PROMPT = `You are a context-compression assistant. Your job is to take raw project details provided by the user and rewrite them into a clean, structured 'primer' — a concise document that gives another AI chat assistant full project context in one go.

Rules:
- Use plain Markdown-like structure (## sections, bullet lists).
- Be thorough but concise — the reader is another AI that needs context fast.
- Preserve every detail provided; do not invent facts.
- Start with a one-line project name and purpose.
- Organise sections naturally: Overview, Current Task, Decisions Made, References.
- Keep it under 400 words.
- Do NOT use greetings or sign-offs — just the primer.
- Output only the primer text, nothing else.`;

Deno.serve(async (req: Request) => {
  // CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v\d+\//, "/");

  // GET /health
  if (req.method === "GET" && (path === "/health" || req.url.endsWith("/health"))) {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST /generate-primer
  if (req.method === "POST" && (path === "/generate-primer" || req.url.endsWith("/generate-primer"))) {
    try {
      const body = await req.json();
      const { project_name, current_task, key_decisions, relevant_links, additional_notes } = body;

      const apiKey = Deno.env.get("FIREWORKS_API_KEY");

      let primer: string;

      if (apiKey) {
        const userPrompt = [
          `Project name: ${project_name ?? ""}`,
          `Current task: ${current_task ?? ""}`,
          `Key decisions: ${key_decisions ?? ""}`,
          `Relevant links: ${relevant_links ?? ""}`,
          `Additional notes: ${additional_notes ?? ""}`,
        ].join("\n");

        const payload = {
          model: MODEL,
          max_tokens: 500,
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        };

        try {
          const resp = await fetch(FIREWORKS_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!resp.ok) {
            throw new Error(`Fireworks API returned ${resp.status}`);
          }

          const data = await resp.json();
          primer = data.choices[0].message.content.trim();
        } catch (_err) {
          // Fallback to plain-text formatting
          primer = buildFallback(project_name, current_task, key_decisions, relevant_links, additional_notes);
        }
      } else {
        primer = buildFallback(project_name, current_task, key_decisions, relevant_links, additional_notes);
      }

      return new Response(JSON.stringify({ primer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // 404 for anything else
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function buildFallback(
  project_name: string,
  current_task: string,
  key_decisions: string,
  relevant_links: string,
  additional_notes: string,
): string {
  const parts: string[] = [];
  if (project_name) parts.push(`# ${project_name}`, "");
  if (current_task) parts.push("## Current Task", current_task, "");
  if (key_decisions) parts.push("## Key Decisions", key_decisions, "");
  if (relevant_links) parts.push("## Relevant Links", relevant_links, "");
  if (additional_notes) parts.push("## Additional Notes", additional_notes, "");
  return parts.join("\n").trim();
}