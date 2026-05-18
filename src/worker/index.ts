import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";

const app = new Hono<{ Bindings: Env }>();

// SPA fallback: any non-/api path that doesn't match a route falls through to
// the static asset handler, which serves index.html for unknown paths thanks
// to `not_found_handling: "single-page-application"` in wrangler.json.
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

app.get("/api/", (c) => c.json({ name: "Agenlytics Assistant" }));

// Transcribe audio via OpenAI Whisper — restricted to English + Simplified Chinese
app.post("/api/transcribe", async (c) => {
  const formData = await c.req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  // Forward to OpenAI Whisper API
  const whisperForm = new FormData();
  whisperForm.append("file", audio, "audio.webm");
  whisperForm.append("model", "whisper-1");
  // Restrict to English and Chinese (simplified) only
  whisperForm.append("language", ""); // let Whisper auto-detect between en/zh
  whisperForm.append(
    "prompt",
    "This audio is in either English or Simplified Chinese (简体中文). Transcribe exactly as spoken."
  );

  try {
    const res = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
        },
        body: whisperForm,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return c.json({ error: `Whisper API error: ${err}` }, 500);
    }

    const result = (await res.json()) as { text: string };

    // Detect language from transcribed text
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    const language = cjkRegex.test(result.text) ? "zh-CN" : "en-US";

    return c.json({ text: result.text, language });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

// Create a new entry: text → Claude categorizes → save to D1
app.post("/api/entries", async (c) => {
  const { text, language } = await c.req.json<{
    text: string;
    language: string;
  }>();

  if (!text?.trim()) {
    return c.json({ error: "Text is required" }, 400);
  }

  const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a personal assistant that categorizes inputs and provides brief feedback.

Categorize the input into exactly ONE of these categories:
- feature_request: New feature ideas or enhancement requests for software/products
- bug_report: Issues, errors, or problems found in software/systems
- personal_planning: Personal life goals, health, finance, travel, family plans
- work_task: Work-related tasks, meetings, deadlines, deliverables
- idea_note: General ideas, thoughts, notes, or observations that don't fit other categories

Rules:
1. Respond in the SAME language as the user's input (Chinese input → Simplified Chinese response, English input → English response)
2. Always use Simplified Chinese (简体中文), never Traditional Chinese
3. Return ONLY valid JSON, no other text
4. The "title" should be a short 3-8 word summary of the input
5. The "feedback" should be 1-2 sentences: acknowledge the input, then offer a helpful observation or suggest a next step

JSON format: {"category": "...", "title": "...", "feedback": "..."}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handles cases where Claude adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return c.json({ error: "Failed to parse AI response" }, 500);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result = await c.env.DB.prepare(
      "INSERT INTO entries (text, language, category, title, feedback) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
      .bind(
        text,
        language || "en-US",
        parsed.category,
        parsed.title || "",
        parsed.feedback
      )
      .first();

    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

// List entries with optional category filter
app.get("/api/entries", async (c) => {
  const category = c.req.query("category");

  let stmt;
  if (category && category !== "all") {
    stmt = c.env.DB.prepare(
      "SELECT * FROM entries WHERE category = ? ORDER BY created_at DESC"
    ).bind(category);
  } else {
    stmt = c.env.DB.prepare(
      "SELECT * FROM entries ORDER BY created_at DESC"
    );
  }

  const { results } = await stmt.all();
  return c.json(results);
});

// Delete an entry
app.delete("/api/entries/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ── CRM: Leads ──────────────────────────────────────────── */

// Create a new lead: voice/text transcript → Claude extracts fields → save to D1
app.post("/api/leads", async (c) => {
  const { text, language } = await c.req.json<{
    text: string;
    language?: string;
  }>();

  if (!text?.trim()) {
    return c.json({ error: "Text is required" }, 400);
  }

  const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You parse spoken/typed input describing a new sales lead into a structured JSON record.

Return ONLY valid JSON, no other text.
Format: {"name": "...", "company": "...", "title": "...", "phone": "...", "email": "...", "product_interest": "...", "estimated_value": null_or_number, "summary": "..."}

Rules:
1. "name" is REQUIRED — if you cannot extract a person's name from the input, return {"error": "No lead name detected"} instead.
2. All other string fields default to "" if not mentioned.
3. "estimated_value" is a number in the smallest currency unit mentioned (strip $ / AUD / 万 etc.), or null if not stated. Example: "around 50k" → 50000.
4. "summary" is a 1–2 sentence acknowledgement of the captured lead, in the SAME language as the input (Chinese input → Simplified Chinese, English input → English). Always Simplified Chinese, never Traditional.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return c.json({ error: "Failed to parse AI response" }, 500);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error) {
      return c.json({ error: parsed.error }, 400);
    }
    if (!parsed.name?.trim()) {
      return c.json({ error: "No lead name detected" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO leads (name, company, title, phone, email, product_interest,
                          estimated_value, status, summary, raw_transcript, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?)
       RETURNING *`
    )
      .bind(
        parsed.name,
        parsed.company || "",
        parsed.title || "",
        parsed.phone || "",
        parsed.email || "",
        parsed.product_interest || "",
        typeof parsed.estimated_value === "number" ? parsed.estimated_value : null,
        parsed.summary || "",
        text,
        language || "en-US"
      )
      .first();

    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

// List leads with optional status filter
app.get("/api/leads", async (c) => {
  const status = c.req.query("status");

  let stmt;
  if (status && status !== "all") {
    stmt = c.env.DB.prepare(
      "SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC"
    ).bind(status);
  } else {
    stmt = c.env.DB.prepare("SELECT * FROM leads ORDER BY created_at DESC");
  }

  const { results } = await stmt.all();
  return c.json(results);
});

// Update a lead's status (and only status — keeping the demo minimal)
app.patch("/api/leads/:id", async (c) => {
  const id = c.req.param("id");
  const { status } = await c.req.json<{ status: string }>();
  if (!status) return c.json({ error: "status is required" }, 400);

  const row = await c.env.DB.prepare(
    "UPDATE leads SET status = ? WHERE id = ? RETURNING *"
  )
    .bind(status, id)
    .first();
  return c.json(row);
});

// Delete a lead
app.delete("/api/leads/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

export default app;
