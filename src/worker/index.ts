import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Agenlytics Assistant" }));

// Create a new entry: transcribe → Claude categorizes → save to D1
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
1. Respond in the SAME language as the user's input (Chinese input → Chinese response, English input → English response)
2. Return ONLY valid JSON, no other text
3. The "title" should be a short 3-8 word summary of the input
4. The "feedback" should be 1-2 sentences: acknowledge the input, then offer a helpful observation or suggest a next step

JSON format: {"category": "...", "title": "...", "feedback": "..."}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
