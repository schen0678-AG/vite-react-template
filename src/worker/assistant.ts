// Personal assistant: turn-based agent that maintains the user's projects,
// features, and todos in D1. Sonnet 4.6 calls a small set of tools and the
// worker applies each call to the database before looping back to the model
// until it emits `respond`. All queries are scoped by user_id.

import Anthropic from "@anthropic-ai/sdk";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ITERATIONS = 10;
const MAX_INPUT_BYTES = 8 * 1024;

/* ── Domain types (mirror types.ts) ───────────────────────── */

export interface Feature {
  id: number;
  project_id: number;
  summary: string;
  details: string[];
  updated_at: string;
}
export interface Project {
  id: number;
  name: string;
  description: string;
  language: string;
  features: Feature[];
  created_at: string;
  updated_at: string;
}
export interface Todo {
  id: number;
  due_at: string | null;
  action: string;
  target: string;
  notes: string;
  status: "pending" | "done" | "cancelled";
  project_id: number | null;
  created_at: string;
  updated_at: string;
}
export interface AssistantState {
  projects: Project[];
  todos: Todo[];
}
export type AssistantOp =
  | { kind: "project_created"; id: number; name: string }
  | { kind: "project_updated"; id: number; name: string }
  | { kind: "project_deleted"; id: number; name: string }
  | { kind: "feature_created"; id: number; project_id: number; summary: string; project_name: string }
  | { kind: "feature_updated"; id: number; project_id: number; summary: string }
  | { kind: "feature_deleted"; id: number; summary: string }
  | { kind: "todo_created"; id: number; action: string; due_at: string | null }
  | { kind: "todo_updated"; id: number; action: string }
  | { kind: "todo_completed"; id: number; action: string }
  | { kind: "todo_deleted"; id: number; action: string };

/* ── State loader ─────────────────────────────────────────── */

export async function loadState(db: D1Database, userId: string): Promise<AssistantState> {
  const [projectsRes, featuresRes, todosRes] = await Promise.all([
    db.prepare(
      "SELECT id, name, description, language, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC",
    )
      .bind(userId)
      .all<Omit<Project, "features">>(),
    db.prepare(
      "SELECT id, project_id, summary, details, updated_at FROM features WHERE user_id = ? ORDER BY updated_at DESC",
    )
      .bind(userId)
      .all<{ id: number; project_id: number; summary: string; details: string; updated_at: string }>(),
    db.prepare(
      "SELECT id, due_at, action, target, notes, status, project_id, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY (due_at IS NULL), due_at ASC, created_at ASC",
    )
      .bind(userId)
      .all<Todo>(),
  ]);

  const featuresByProject = new Map<number, Feature[]>();
  for (const f of featuresRes.results) {
    const arr = featuresByProject.get(f.project_id) ?? [];
    let details: string[] = [];
    try {
      const parsed = JSON.parse(f.details);
      if (Array.isArray(parsed)) details = parsed.filter((d): d is string => typeof d === "string");
    } catch {
      details = [];
    }
    arr.push({ id: f.id, project_id: f.project_id, summary: f.summary, details, updated_at: f.updated_at });
    featuresByProject.set(f.project_id, arr);
  }

  const projects: Project[] = projectsRes.results.map((p) => ({
    ...p,
    features: featuresByProject.get(p.id) ?? [],
  }));

  return { projects, todos: todosRes.results };
}

/* ── Tools ────────────────────────────────────────────────── */

// Schema definitions follow Anthropic's tool format. Each tool maps to a
// single, validated SQL operation. Keep names short — they end up in the
// model's reasoning budget.

const tools = [
  {
    name: "create_project",
    description:
      "Create a NEW project. Only call this when the user's input clearly introduces a topic that doesn't fit any existing project.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short project name, 2-6 words." },
        description: { type: "string", description: "One-sentence description." },
      },
      required: ["name"],
    },
  },
  {
    name: "update_project",
    description: "Rename or change the description of an existing project.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_project",
    description: "Delete a project and all its features (cascades). Use only when the user explicitly asks.",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "create_feature",
    description:
      "Add a NEW feature under a project. Pass `project_id` if the project exists, OR `project_name` to create the project on the fly (omit project_id then). Only use this if no existing feature in the target project covers the same topic.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "number" },
        project_name: { type: "string", description: "Fallback when no project_id matches; creates the project first." },
        summary: { type: "string", description: "Short feature title, 2-6 words." },
        details: {
          type: "array",
          items: { type: "string" },
          description: "Bullet-point details, one item per bullet.",
        },
      },
      required: ["summary"],
    },
  },
  {
    name: "update_feature",
    description:
      "Modify an existing feature: rename its summary, replace details, or add/remove specific bullets. Prefer 'append' when the user's input adds new context, 'replace' only when they explicitly rewrite the whole thing.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number" },
        summary: { type: "string" },
        details_action: {
          type: "string",
          enum: ["replace", "append", "remove_indices"],
          description: "How to update the bullet list.",
        },
        details: { type: "array", items: { type: "string" } },
        remove_indices: { type: "array", items: { type: "number" } },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_feature",
    description: "Delete a single feature.",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "create_todo",
    description:
      "Add a calendar-style action item. `due_at` is ISO 8601 (e.g. 2026-05-26T06:00:00) — use the current_datetime from the system prompt to resolve relative dates like 'tomorrow' or 'next Friday'. Omit due_at if the user didn't specify a time.",
    input_schema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Verb phrase, e.g. 'Send invitation'." },
        target: { type: "string", description: "Subject, e.g. 'team weekly sync'." },
        notes: { type: "string" },
        due_at: { type: "string", description: "ISO 8601 datetime; omit if undated." },
        project_id: { type: "number", description: "Optional link to a project." },
      },
      required: ["action"],
    },
  },
  {
    name: "update_todo",
    description: "Edit fields of an existing todo (reschedule, rename, retarget, etc.).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number" },
        action: { type: "string" },
        target: { type: "string" },
        notes: { type: "string" },
        due_at: { type: "string" },
        project_id: { type: "number" },
      },
      required: ["id"],
    },
  },
  {
    name: "complete_todo",
    description: "Mark a todo as done.",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "delete_todo",
    description: "Hard-delete a todo.",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "respond",
    description:
      "Final reply to the user, summarizing what changed. ALWAYS the last tool call of the turn. Match the user's language (English ↔ Simplified Chinese, never Traditional).",
    input_schema: {
      type: "object",
      properties: { text: { type: "string", description: "1-3 sentence reply." } },
      required: ["text"],
    },
  },
] as const;

/* ── System prompt ────────────────────────────────────────── */

function buildSystemPrompt(state: AssistantState, language: string): string {
  const now = new Date().toISOString();
  const stateJson = JSON.stringify(compactState(state), null, 0);
  return `You are the user's personal organizer. You maintain TWO structures on their behalf:

1. **Projects** — each has a name, description, and a list of **features**. Each feature has a short summary and bullet-point details.
2. **Todos** — calendar items with action + target + optional due date.

Your loop on every user message:
1. Read the CURRENT_STATE below.
2. Decide whether the message should MERGE INTO, MODIFY, or DELETE an existing item — only create new items when nothing fits.
3. If the user mentions a project or feature by name or topic, try hard to match an existing one before creating. Fuzzy match: "data analysis" should map to an existing "Self-serve data analysis" project.
4. When adding bullets to an existing feature, use update_feature with details_action="append".
5. When the user says things like "remind me to X at Y", create a todo.
6. ALWAYS finish with a call to \`respond\` summarizing what you did, in the user's language.

Rules:
- Respond in the SAME language as the user's input (English input → English; Chinese input → Simplified Chinese, never Traditional).
- Don't invent details the user didn't mention.
- For relative dates ("tomorrow", "next Tuesday at 6am"), resolve using current_datetime = ${now}.
- Never call any tool with an id that isn't in CURRENT_STATE.
- Keep \`respond\` text short: 1-3 sentences.
- It is fine to make zero structural changes if the message is conversational — just call \`respond\`.

User's preferred language for this turn: ${language || "en-US"}

CURRENT_STATE:
${stateJson}`;
}

// Trim what we feed to the model so it doesn't drown in old timestamps.
function compactState(state: AssistantState) {
  return {
    projects: state.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      features: p.features.map((f) => ({
        id: f.id,
        summary: f.summary,
        details: f.details,
      })),
    })),
    todos: state.todos
      .filter((t) => t.status !== "cancelled")
      .map((t) => ({
        id: t.id,
        due_at: t.due_at,
        action: t.action,
        target: t.target,
        notes: t.notes,
        status: t.status,
        project_id: t.project_id,
      })),
  };
}

/* ── Operation handlers ───────────────────────────────────── */

type Ctx = {
  db: D1Database;
  userId: string;
  language: string;
  state: AssistantState;
  ops: AssistantOp[];
};

type ToolInput = Record<string, unknown>;

async function applyOp(name: string, input: ToolInput, ctx: Ctx): Promise<Json> {
  try {
    switch (name) {
      case "create_project": {
        const projectName = strOr(input.name, "");
        if (!projectName) return { ok: false, error: "name required" };
        const row = await ctx.db.prepare(
          "INSERT INTO projects (user_id, name, description, language) VALUES (?, ?, ?, ?) RETURNING id, name",
        )
          .bind(ctx.userId, projectName, strOr(input.description, ""), ctx.language || "en-US")
          .first<{ id: number; name: string }>();
        if (!row) return { ok: false, error: "insert failed" };
        ctx.state.projects.unshift({
          id: row.id, name: row.name, description: strOr(input.description, ""),
          language: ctx.language || "en-US", features: [],
          created_at: nowIso(), updated_at: nowIso(),
        });
        ctx.ops.push({ kind: "project_created", id: row.id, name: row.name });
        return { ok: true, id: row.id, name: row.name };
      }
      case "update_project": {
        const id = numOr(input.id, 0);
        const project = findProject(ctx.state, id);
        if (!project) return { ok: false, error: `project ${id} not found` };
        const next = {
          name: typeof input.name === "string" ? input.name : project.name,
          description: typeof input.description === "string" ? input.description : project.description,
        };
        await ctx.db.prepare(
          "UPDATE projects SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        )
          .bind(next.name, next.description, id, ctx.userId)
          .run();
        project.name = next.name;
        project.description = next.description;
        ctx.ops.push({ kind: "project_updated", id, name: next.name });
        return { ok: true };
      }
      case "delete_project": {
        const id = numOr(input.id, 0);
        const project = findProject(ctx.state, id);
        if (!project) return { ok: false, error: `project ${id} not found` };
        await ctx.db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?")
          .bind(id, ctx.userId)
          .run();
        ctx.state.projects = ctx.state.projects.filter((p) => p.id !== id);
        ctx.ops.push({ kind: "project_deleted", id, name: project.name });
        return { ok: true };
      }
      case "create_feature": {
        const summary = strOr(input.summary, "");
        if (!summary) return { ok: false, error: "summary required" };
        let projectId = numOr(input.project_id, 0);
        let project = findProject(ctx.state, projectId);
        if (!project && typeof input.project_name === "string" && input.project_name.trim()) {
          const created = await applyOp("create_project", { name: input.project_name }, ctx) as { ok: boolean; id?: number };
          if (!created.ok || !created.id) return { ok: false, error: "failed to create parent project" };
          projectId = created.id;
          project = findProject(ctx.state, projectId);
        }
        if (!project) return { ok: false, error: "project_id or project_name required" };
        const details = Array.isArray(input.details)
          ? (input.details as unknown[]).filter((d): d is string => typeof d === "string")
          : [];
        const row = await ctx.db.prepare(
          "INSERT INTO features (user_id, project_id, summary, details) VALUES (?, ?, ?, ?) RETURNING id",
        )
          .bind(ctx.userId, projectId, summary, JSON.stringify(details))
          .first<{ id: number }>();
        if (!row) return { ok: false, error: "insert failed" };
        await ctx.db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").bind(projectId).run();
        project.features.unshift({ id: row.id, project_id: projectId, summary, details, updated_at: nowIso() });
        ctx.ops.push({ kind: "feature_created", id: row.id, project_id: projectId, summary, project_name: project.name });
        return { ok: true, id: row.id };
      }
      case "update_feature": {
        const id = numOr(input.id, 0);
        const located = findFeature(ctx.state, id);
        if (!located) return { ok: false, error: `feature ${id} not found` };
        const { feature } = located;
        const nextSummary = typeof input.summary === "string" ? input.summary : feature.summary;
        let nextDetails = feature.details;
        const action = typeof input.details_action === "string" ? input.details_action : null;
        if (action === "replace" && Array.isArray(input.details)) {
          nextDetails = (input.details as unknown[]).filter((d): d is string => typeof d === "string");
        } else if (action === "append" && Array.isArray(input.details)) {
          const added = (input.details as unknown[]).filter((d): d is string => typeof d === "string");
          nextDetails = [...feature.details, ...added];
        } else if (action === "remove_indices" && Array.isArray(input.remove_indices)) {
          const toDrop = new Set((input.remove_indices as unknown[]).filter((n): n is number => typeof n === "number"));
          nextDetails = feature.details.filter((_, i) => !toDrop.has(i));
        }
        await ctx.db.prepare(
          "UPDATE features SET summary = ?, details = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        )
          .bind(nextSummary, JSON.stringify(nextDetails), id, ctx.userId)
          .run();
        feature.summary = nextSummary;
        feature.details = nextDetails;
        ctx.ops.push({ kind: "feature_updated", id, project_id: feature.project_id, summary: nextSummary });
        return { ok: true };
      }
      case "delete_feature": {
        const id = numOr(input.id, 0);
        const located = findFeature(ctx.state, id);
        if (!located) return { ok: false, error: `feature ${id} not found` };
        await ctx.db.prepare("DELETE FROM features WHERE id = ? AND user_id = ?").bind(id, ctx.userId).run();
        located.project.features = located.project.features.filter((f) => f.id !== id);
        ctx.ops.push({ kind: "feature_deleted", id, summary: located.feature.summary });
        return { ok: true };
      }
      case "create_todo": {
        const action = strOr(input.action, "");
        if (!action) return { ok: false, error: "action required" };
        const dueAt = validIsoOrNull(input.due_at);
        const target = strOr(input.target, "");
        const notes = strOr(input.notes, "");
        const projectId = numOr(input.project_id, 0) || null;
        if (projectId && !findProject(ctx.state, projectId)) return { ok: false, error: "project_id not found" };
        const row = await ctx.db.prepare(
          "INSERT INTO todos (user_id, action, target, notes, due_at, project_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, due_at, action",
        )
          .bind(ctx.userId, action, target, notes, dueAt, projectId)
          .first<{ id: number; due_at: string | null; action: string }>();
        if (!row) return { ok: false, error: "insert failed" };
        ctx.state.todos.push({
          id: row.id, due_at: dueAt, action, target, notes,
          status: "pending", project_id: projectId,
          created_at: nowIso(), updated_at: nowIso(),
        });
        ctx.ops.push({ kind: "todo_created", id: row.id, action, due_at: dueAt });
        return { ok: true, id: row.id };
      }
      case "update_todo": {
        const id = numOr(input.id, 0);
        const todo = ctx.state.todos.find((t) => t.id === id);
        if (!todo) return { ok: false, error: `todo ${id} not found` };
        const next = {
          action: typeof input.action === "string" ? input.action : todo.action,
          target: typeof input.target === "string" ? input.target : todo.target,
          notes: typeof input.notes === "string" ? input.notes : todo.notes,
          due_at: input.due_at === undefined ? todo.due_at : validIsoOrNull(input.due_at),
          project_id: input.project_id === undefined ? todo.project_id : (numOr(input.project_id, 0) || null),
        };
        if (next.project_id && !findProject(ctx.state, next.project_id)) return { ok: false, error: "project_id not found" };
        await ctx.db.prepare(
          "UPDATE todos SET action = ?, target = ?, notes = ?, due_at = ?, project_id = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        )
          .bind(next.action, next.target, next.notes, next.due_at, next.project_id, id, ctx.userId)
          .run();
        Object.assign(todo, next);
        ctx.ops.push({ kind: "todo_updated", id, action: next.action });
        return { ok: true };
      }
      case "complete_todo": {
        const id = numOr(input.id, 0);
        const todo = ctx.state.todos.find((t) => t.id === id);
        if (!todo) return { ok: false, error: `todo ${id} not found` };
        await ctx.db.prepare("UPDATE todos SET status = 'done', updated_at = datetime('now') WHERE id = ? AND user_id = ?")
          .bind(id, ctx.userId)
          .run();
        todo.status = "done";
        ctx.ops.push({ kind: "todo_completed", id, action: todo.action });
        return { ok: true };
      }
      case "delete_todo": {
        const id = numOr(input.id, 0);
        const todo = ctx.state.todos.find((t) => t.id === id);
        if (!todo) return { ok: false, error: `todo ${id} not found` };
        await ctx.db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").bind(id, ctx.userId).run();
        ctx.state.todos = ctx.state.todos.filter((t) => t.id !== id);
        ctx.ops.push({ kind: "todo_deleted", id, action: todo.action });
        return { ok: true };
      }
      default:
        return { ok: false, error: `unknown tool: ${name}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}

/* ── Helpers ──────────────────────────────────────────────── */

function nowIso(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
function strOr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v.trim() : fallback;
}
function numOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function validIsoOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function findProject(state: AssistantState, id: number): Project | undefined {
  return state.projects.find((p) => p.id === id);
}
function findFeature(state: AssistantState, id: number): { project: Project; feature: Feature } | undefined {
  for (const project of state.projects) {
    const feature = project.features.find((f) => f.id === id);
    if (feature) return { project, feature };
  }
  return undefined;
}

/* ── Public entry point ───────────────────────────────────── */

export async function runAssistantTurn(
  env: Env,
  userId: string,
  text: string,
  language: string,
): Promise<{ ops: AssistantOp[]; reply: string; state: AssistantState }> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("text is required");
  if (new TextEncoder().encode(trimmed).length > MAX_INPUT_BYTES) {
    throw new Error(`Message too long (max ${MAX_INPUT_BYTES} bytes)`);
  }

  const state = await loadState(env.DB, userId);
  const ctx: Ctx = { db: env.DB, userId, language, state, ops: [] };

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const system = buildSystemPrompt(state, language);

  type AnthropicContent =
    | { type: "text"; text: string }
    | { type: "tool_use"; id: string; name: string; input: ToolInput }
    | { type: "tool_result"; tool_use_id: string; content: string };
  const messages: { role: "user" | "assistant"; content: AnthropicContent[] | string }[] = [
    { role: "user", content: trimmed },
  ];

  let reply = "";

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
    });

    const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    // If the model didn't call any tool, treat its text as the reply.
    if (toolUses.length === 0) {
      const textBlock = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      reply = textBlock?.text ?? "";
      break;
    }

    // Run each tool call, then feed back the results in a single user turn.
    const toolResults: AnthropicContent[] = [];
    let didRespond = false;
    for (const tu of toolUses) {
      if (tu.name === "respond") {
        reply = strOr((tu.input as ToolInput).text, "");
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: '{"ok":true}' });
        didRespond = true;
      } else {
        const result = await applyOp(tu.name, tu.input as ToolInput, ctx);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages.push({ role: "assistant", content: resp.content as any });
    messages.push({ role: "user", content: toolResults });
    if (didRespond) break;
  }

  if (!reply) {
    reply =
      language === "zh-CN"
        ? "我已经更新了你的项目和待办。"
        : "I've updated your projects and todos.";
  }

  return { ops: ctx.ops, reply, state: ctx.state };
}
