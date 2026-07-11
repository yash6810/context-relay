import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ---------------------------------------------------------------------------
// Constants — adjust these at the top for your demo
// ---------------------------------------------------------------------------

const MAX_FIELD_LENGTH = 5_000; // max characters per text field
const FIREWORKS_MAX_TOKENS = 500; // max output tokens per Fireworks call

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(s: unknown, maxLen: number): string {
  const str = String(s ?? "");
  return str.slice(0, maxLen);
}

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

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

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
      const {
        project_name = "",
        current_task = "",
        key_decisions = "",
        relevant_links = "",
        additional_notes = "",
      } = body;

      // ---- Input validation: truncate fields to prevent credit-burning abuse ----
      const safe = {
        project_name: truncate(project_name, MAX_FIELD_LENGTH),
        current_task: truncate(current_task, MAX_FIELD_LENGTH),
        key_decisions: truncate(key_decisions, MAX_FIELD_LENGTH),
        relevant_links: truncate(relevant_links, MAX_FIELD_LENGTH),
        additional_notes: truncate(additional_notes, MAX_FIELD_LENGTH),
      };

      const apiKey = Deno.env.get("FIREWORKS_API_KEY");

      let primer: string;

      if (apiKey) {
        const userPrompt = [
          `Project name: ${safe.project_name}`,
          `Current task: ${safe.current_task}`,
          `Key decisions: ${safe.key_decisions}`,
          `Relevant links: ${safe.relevant_links}`,
          `Additional notes: ${safe.additional_notes}`,
        ].join("\n");

        const payload = {
          model: MODEL,
          max_tokens: FIREWORKS_MAX_TOKENS,
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
          primer = buildFallback(
            safe.project_name,
            safe.current_task,
            safe.key_decisions,
            safe.relevant_links,
            safe.additional_notes,
          );
        }
      } else {
        primer = buildFallback(
          safe.project_name,
          safe.current_task,
          safe.key_decisions,
          safe.relevant_links,
          safe.additional_notes,
        );
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