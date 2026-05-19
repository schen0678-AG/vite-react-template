import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { googleAuth, type AuthedVars } from "./auth";

const app = new Hono<{ Bindings: Env; Variables: AuthedVars }>();

// Verify Google ID tokens on every /api/* request (except the public health
// probe — see worker/auth.ts). Protected handlers can read c.get("user").
app.use("/api/*", googleAuth());

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

// Returns the current authed user. The /api/* middleware has already verified
// the token + allowlist by the time we get here, so this is a 200 / 401 / 403
// probe the frontend calls right after sign-in to confirm access.
app.get("/api/auth/me", (c) => c.json(c.get("user")));

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
  const { text, language, salesperson } = await c.req.json<{
    text: string;
    language?: string;
    salesperson?: string;
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
                          estimated_value, status, summary, raw_transcript, language, salesperson)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?)
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
        language || "en-US",
        salesperson || ""
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

// Convert a lead into a deal (and mark the lead Converted)
app.post("/api/leads/:id/convert", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    stage?: string;
    probability?: number;
    deal_value?: number | null;
    expected_close_date?: string | null;
    notes?: string;
  }>();

  const lead = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?")
    .bind(id)
    .first<{
      id: number;
      name: string;
      company: string;
      estimated_value: number | null;
      language: string;
      salesperson: string;
    }>();
  if (!lead) return c.json({ error: "Lead not found" }, 404);

  const dealName = body.name?.trim() || `${lead.name} – ${lead.company || "Deal"}`;
  const dealValue =
    typeof body.deal_value === "number" ? body.deal_value : lead.estimated_value;

  const deal = await c.env.DB.prepare(
    `INSERT INTO deals (name, lead_id, company, contact_name, stage, probability,
                        deal_value, expected_close_date, notes, language, salesperson)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      dealName,
      lead.id,
      lead.company,
      lead.name,
      body.stage || "New Opportunity",
      typeof body.probability === "number" ? body.probability : 25,
      dealValue,
      body.expected_close_date || null,
      body.notes || "",
      lead.language || "en-US",
      lead.salesperson || ""
    )
    .first();

  await c.env.DB.prepare("UPDATE leads SET status = 'Converted' WHERE id = ?")
    .bind(id)
    .run();

  return c.json(deal);
});

/* ── CRM: Contacts ───────────────────────────────────────── */

// Create a contact from text/voice transcript
app.post("/api/contacts", async (c) => {
  const body = await c.req.json<{
    text?: string;
    language?: string;
    parsed?: ParsedContactPayload;
    source?: string;
  }>();

  // Two ways to create: from a transcript (Claude parses) OR from already-parsed
  // fields (e.g. business card scan that the user has reviewed/edited).
  let parsed: ParsedContactPayload;
  let language = body.language || "en-US";
  let source = body.source || "manual";

  if (body.parsed) {
    parsed = body.parsed;
  } else if (body.text?.trim()) {
    const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
    const sys = `You parse spoken/typed input describing a business contact into a structured JSON record.

Return ONLY valid JSON, no other text.
Format: {"name": "...", "company": "...", "title": "...", "email": "...", "phone": "...", "wechat": "...", "address": "...", "notes": "..."}

Rules:
1. "name" is REQUIRED — if you cannot extract a person's name, return {"error": "No contact name detected"}.
2. All other string fields default to "" if not mentioned.
3. Respond in the SAME language as the input. Always Simplified Chinese, never Traditional.`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: sys,
      messages: [{ role: "user", content: body.text }],
    });
    const txt = msg.content[0].type === "text" ? msg.content[0].text : "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return c.json({ error: "Failed to parse AI response" }, 500);
    const data = JSON.parse(m[0]);
    if (data.error) return c.json({ error: data.error }, 400);
    parsed = data;
    source = source === "manual" ? "voice" : source;
  } else {
    return c.json({ error: "Provide either text or parsed contact" }, 400);
  }

  if (!parsed.name?.trim()) {
    return c.json({ error: "Contact name is required" }, 400);
  }

  const row = await c.env.DB.prepare(
    `INSERT INTO contacts (name, company, title, email, phone, wechat, address,
                           notes, source, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      parsed.name,
      parsed.company || "",
      parsed.title || "",
      parsed.email || "",
      parsed.phone || "",
      parsed.wechat || "",
      parsed.address || "",
      parsed.notes || "",
      source,
      language
    )
    .first();
  return c.json(row);
});

// Scan a business card image → Claude vision extracts fields (no DB write)
app.post("/api/contacts/scan-card", async (c) => {
  const formData = await c.req.formData();
  const image = formData.get("image") as File | null;
  if (!image) return c.json({ error: "No image provided" }, 400);
  if (image.size > 4 * 1024 * 1024) {
    return c.json({ error: "Image too large (max 4MB)" }, 400);
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  // base64 (no chunking — File is <4MB)
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);

  const mediaType =
    (image.type && image.type.startsWith("image/") && image.type) || "image/jpeg";

  const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: `You extract business-card information from images. Return ONLY valid JSON, no other text.
Format: {"name": "...", "company": "...", "title": "...", "email": "...", "phone": "...", "wechat": "...", "address": "...", "notes": ""}
- "name" is required; if unreadable return {"error": "Could not read a name from the card"}.
- All other fields default to "" if not present on the card.
- Use Simplified Chinese (not Traditional) when the card text is Chinese.`,
    messages: [
      {
        role: "user",
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } } as any,
          { type: "text", text: "Extract the contact details from this business card." },
        ],
      },
    ],
  });

  const txt = msg.content[0].type === "text" ? msg.content[0].text : "";
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return c.json({ error: "Failed to parse AI response" }, 500);
  const data = JSON.parse(m[0]);
  if (data.error) return c.json({ error: data.error }, 400);

  // Return parsed fields for the user to review/edit before saving.
  return c.json({ parsed: data });
});

app.get("/api/contacts", async (c) => {
  const search = c.req.query("search");
  let stmt;
  if (search) {
    const q = `%${search}%`;
    stmt = c.env.DB.prepare(
      `SELECT * FROM contacts
       WHERE name LIKE ? OR company LIKE ? OR email LIKE ?
       ORDER BY created_at DESC`
    ).bind(q, q, q);
  } else {
    stmt = c.env.DB.prepare("SELECT * FROM contacts ORDER BY created_at DESC");
  }
  const { results } = await stmt.all();
  return c.json(results);
});

app.delete("/api/contacts/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM contacts WHERE id = ?")
    .bind(c.req.param("id"))
    .run();
  return c.json({ ok: true });
});

/* ── CRM: Deals ──────────────────────────────────────────── */

app.get("/api/deals", async (c) => {
  const stage = c.req.query("stage");
  const stmt =
    stage && stage !== "all"
      ? c.env.DB.prepare("SELECT * FROM deals WHERE stage = ? ORDER BY created_at DESC").bind(stage)
      : c.env.DB.prepare("SELECT * FROM deals ORDER BY created_at DESC");
  const { results } = await stmt.all();
  return c.json(results);
});

app.patch("/api/deals/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json<{
    stage?: string;
    probability?: number;
    deal_value?: number | null;
    expected_close_date?: string | null;
    notes?: string;
  }>();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    values.push(v as string | number | null);
  }
  if (!fields.length) return c.json({ error: "No fields to update" }, 400);
  values.push(id);
  const row = await c.env.DB.prepare(
    `UPDATE deals SET ${fields.join(", ")} WHERE id = ? RETURNING *`
  )
    .bind(...values)
    .first();
  return c.json(row);
});

app.delete("/api/deals/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM deals WHERE id = ?")
    .bind(c.req.param("id"))
    .run();
  return c.json({ ok: true });
});

/* ── Dashboard ───────────────────────────────────────────── */

// Headline counters (leads, contacts, pipeline=deals, accounts=distinct companies)
app.get("/api/dashboard/summary", async (c) => {
  const [leads, contacts, deals, accounts] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM leads").first<{ n: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM contacts").first<{ n: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM deals").first<{ n: number }>(),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT company FROM contacts WHERE company <> ''
         UNION
         SELECT company FROM leads    WHERE company <> ''
         UNION
         SELECT company FROM deals    WHERE company <> ''
       )`
    ).first<{ n: number }>(),
  ]);
  return c.json({
    leads:    leads?.n ?? 0,
    contacts: contacts?.n ?? 0,
    pipeline: deals?.n ?? 0,
    accounts: accounts?.n ?? 0,
  });
});

// Daily new leads grouped by salesperson, over the last N days (default 14)
app.get("/api/dashboard/leads-by-day", async (c) => {
  const days = Math.min(60, Math.max(1, Number(c.req.query("days")) || 14));
  const { results } = await c.env.DB.prepare(
    `SELECT substr(created_at, 1, 10) AS day,
            COALESCE(NULLIF(salesperson, ''), 'unassigned') AS person,
            COUNT(*) AS n
       FROM leads
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY day, person
      ORDER BY day ASC`
  )
    .bind(days)
    .all<{ day: string; person: string; n: number }>();

  // Build a dense day-by-day series so the chart shows zeros.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const series: { date: string; byPerson: Record<string, number> }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    series.push({ date: d.toISOString().slice(0, 10), byPerson: {} });
  }
  const index = new Map(series.map((s, i) => [s.date, i]));
  for (const r of results) {
    const i = index.get(r.day);
    if (i == null) continue;
    series[i].byPerson[r.person] = r.n;
  }
  return c.json(series);
});

// Lead → pipeline conversion stats (window + all-time)
app.get("/api/dashboard/conversion", async (c) => {
  const days = Math.min(60, Math.max(1, Number(c.req.query("days")) || 14));
  const window = await c.env.DB.prepare(
    `SELECT
       SUM(CASE WHEN created_at >= datetime('now', '-' || ? || ' days') THEN 1 ELSE 0 END) AS total,
       SUM(CASE WHEN created_at >= datetime('now', '-' || ? || ' days') AND status = 'Converted' THEN 1 ELSE 0 END) AS converted
     FROM leads`
  )
    .bind(days, days)
    .first<{ total: number; converted: number }>();
  const all = await c.env.DB.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) AS converted
       FROM leads`
  ).first<{ total: number; converted: number }>();

  const wt = window?.total ?? 0;
  const wc = window?.converted ?? 0;
  const at = all?.total ?? 0;
  const ac = all?.converted ?? 0;
  return c.json({
    windowDays:       days,
    windowLeads:      wt,
    windowConverted:  wc,
    windowRate:       wt ? wc / wt : 0,
    allTimeLeads:     at,
    allTimeConverted: ac,
    allTimeRate:      at ? ac / at : 0,
  });
});

// Sales / commission by salesperson (Won deals + open pipeline)
app.get("/api/dashboard/sales-by-person", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT
       COALESCE(NULLIF(salesperson, ''), 'unassigned') AS salesperson,
       SUM(CASE WHEN stage = 'Won' THEN 1 ELSE 0 END)                                  AS wonCount,
       COALESCE(SUM(CASE WHEN stage = 'Won' THEN deal_value END), 0)                   AS wonValue,
       COALESCE(SUM(CASE WHEN stage NOT IN ('Won','Lost') THEN deal_value END), 0)     AS pipelineValue,
       COALESCE(SUM(CASE WHEN stage NOT IN ('Won','Lost')
                          THEN deal_value * probability / 100.0 END), 0)               AS weightedValue,
       COALESCE(SUM(CASE WHEN stage = 'Won' THEN deal_value * commission_rate END), 0) AS commission
     FROM deals
     GROUP BY salesperson
     ORDER BY wonValue DESC, pipelineValue DESC`
  ).all();
  return c.json(results);
});

interface ParsedContactPayload {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  address?: string;
  notes?: string;
}

export default app;
