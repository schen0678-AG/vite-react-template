import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";

const app = new Hono<{ Bindings: Env }>();

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
      model: "claude-3-haiku-20240307",
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

export default app;
