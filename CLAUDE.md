# Agenlytics Labs — vite-react-template

## Project Overview

A small full-stack app that demonstrates an AI-powered personal assistant + an agent showcase ("org chart"). Marketing-site landing page + voice/text input → Claude categorises → entries persist in Cloudflare D1.

Branded as **Agenlytics Labs** ("Agent + Analytics"). Tagline: "AI agents powered by your data."

## Tech Stack

- **React 19** + **TypeScript 5.8** + **Vite 6**
- **Hono 4** — ultra-light backend, runs as a Cloudflare Worker
- **Cloudflare Workers** (deployed via wrangler) — edge runtime; `nodejs_compat` enabled
- **Cloudflare D1** — SQLite at the edge; bound as `env.DB`
- **@anthropic-ai/sdk** for Claude (model `claude-haiku-4-5-20251001`)
- **OpenAI Whisper** for audio transcription (via direct REST fetch, no SDK)
- **No CSS framework** — single `App.css` (~1200 lines) of hand-rolled styles
- **No router** — `App.tsx` reads `window.location.pathname` and renders one of three pages

## Directory Structure

```
src/
  react-app/                  # frontend (Vite SPA)
    main.tsx                  # React entry
    App.tsx                   # path-based router (/, /assistant, /agents)
    App.css                   # all app styles
    index.css                 # base styles
    types.ts                  # Entry, EntryCategory, CATEGORIES map (en/zh labels)
    speech.d.ts               # MediaRecorder TS shims
    components/
      LandingPage.tsx         # marketing site at /
      AssistantPage.tsx       # /assistant — wraps VoiceInput + HistoryList
      AgentsPage.tsx          # /agents — hardcoded agent org chart with detail modal
      VoiceInput.tsx          # mic recording → Whisper → POST /api/entries
      HistoryList.tsx         # category filter bar + entry list
      EntryCard.tsx           # single entry card (badge + title + text + feedback)
  worker/
    index.ts                  # Hono app — all backend routes
schema.sql                    # D1 schema (single `entries` table)
wrangler.json                 # Workers config (D1 binding, compatibility flags)
vite.config.ts                # vite + @cloudflare/vite-plugin (no proxy needed)
```

## Routing

**Frontend routing is pathname-based** — no React Router. In `App.tsx`:

```tsx
if (page === "/assistant") return <AssistantPage />;
if (page === "/agents")    return <AgentsPage />;
return <LandingPage />;
```

Navigation uses plain `<a href="...">` (full reload). The `popstate` listener handles back/forward. Wrangler's `not_found_handling: "single-page-application"` (wrangler.json) means any path returns `index.html` so client-side routing works for direct hits.

**To add a new page:** create a component, add a branch in `App.tsx`, link to it with `<a href="/your-path">`.

## API (`src/worker/index.ts`)

All routes are mounted under `/api/`. The Worker `env` bindings: `DB` (D1), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.

| Method | Path                       | Purpose |
|--------|----------------------------|---------|
| GET    | `/api/`                    | Health/identity probe |
| POST   | `/api/transcribe`          | Whisper transcription. Body: `multipart/form-data` with `audio` file. Returns `{ text, language }` where language is `en-US` or `zh-CN` (CJK detection on output text). |
| POST   | `/api/entries`             | Categorise + persist. Body: `{ text, language }`. Calls Claude with a strict JSON system prompt, parses `{category, title, feedback}`, inserts into D1, returns the row. |
| GET    | `/api/entries?category=X`  | List entries (newest first); `category=all` or omitted → all. |
| DELETE | `/api/entries/:id`         | Remove an entry. |

## D1 Schema

Single table — see `schema.sql`:

```sql
entries(
  id INTEGER PK,
  text TEXT,
  language TEXT DEFAULT 'en-US',
  category TEXT,
  title TEXT DEFAULT '',
  feedback TEXT,
  created_at TEXT DEFAULT datetime('now')
)
```

Indexed on `category` and `created_at`. Database id and binding are in `wrangler.json` (`assistant-db`, binding `DB`).

**Local dev:** wrangler manages a local D1 SQLite file. Apply the schema to local with:
```bash
npx wrangler d1 execute assistant-db --local --file=schema.sql
```
For prod: drop `--local`.

## Categories

Defined twice — keep them in sync if you add a new one:

1. `src/react-app/types.ts` → `EntryCategory` union + `CATEGORIES` map with `en` / `zh` labels and colours.
2. `src/worker/index.ts` → system prompt for Claude in `/api/entries` lists the allowed categories.

Current set: `feature_request`, `bug_report`, `personal_planning`, `work_task`, `idea_note`.

## Agent Showcase (`/agents`)

`AgentsPage.tsx` contains a hardcoded `teams: Team[]` array — purely presentational ("meet the team" org chart with click-for-detail modal). The agent personas (Nova, Aria, Sage, Luca, Rex-CRM, Mila, Jason, Rex, Vera, Maya, Zara, Myrtle) are not connected to any backend logic; this page is marketing for the broader Agenlytics Labs concept.

If you want to make agents actually chat, you'd need a new route + Worker endpoint (model would be Claude via the Anthropic SDK already in deps).

## Conventions

- **Bilingual UX**: CJK regex `/[一-鿿㐀-䶿]/` is used in two places (worker `/api/transcribe` and `VoiceInput.detectLanguage`) to decide whether output language is `zh-CN` or `en-US`. Claude is instructed to respond in the same language as the input. Always **Simplified Chinese** — system prompt rejects Traditional.
- **No file generation** — all output is JSON or chat-style text; no PDF/PPT.
- **Whisper prompt** in the worker steers the model toward EN/zh-CN only; the `language` form field is intentionally left blank to allow auto-detection.
- **Claude JSON parsing** uses a `/\{[\s\S]*\}/` regex to extract JSON from the response — defensive against models that wrap JSON in prose.
- **Wrangler tunnels API calls in dev**: the `@cloudflare/vite-plugin` runs the Worker in-process — no separate backend proc, no proxy config. `/api/*` requests from the React app are served by Hono.
- **Single-page-app fallback**: `not_found_handling: "single-page-application"` in wrangler.json ensures direct loads of `/assistant`, `/agents` etc. return `index.html`.

## Running

```bash
npm install           # one-time
npm run dev           # http://localhost:5173 (auto-picks next port if taken)
                      # Worker runs in-process — no separate backend
```

Local dev needs the two API keys. Put them in `.dev.vars` at the repo root (gitignored by wrangler convention):
```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

Apply schema to the local D1:
```bash
npx wrangler d1 execute assistant-db --local --file=schema.sql
```

## Build / Deploy

```bash
npm run build         # tsc -b && vite build → dist/client + worker bundle
npm run check         # build + wrangler deploy --dry-run (CI gate)
npm run deploy        # wrangler deploy → Cloudflare Workers
npx wrangler tail     # live logs from prod
```

Production secrets go via wrangler (not committed):
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

D1 schema in prod (one-time):
```bash
npx wrangler d1 execute assistant-db --remote --file=schema.sql
```

## When Making Changes

- **New page** — component in `components/`, add a branch in `App.tsx`, link with `<a href="/...">`.
- **New API route** — add a handler to `src/worker/index.ts`. `env.DB` for D1, `env.ANTHROPIC_API_KEY` / `env.OPENAI_API_KEY` for upstream calls. Generated types are in `worker-configuration.d.ts` (regenerate with `npm run cf-typegen` after adding bindings to wrangler.json).
- **New table/column** — append to `schema.sql`, re-run `wrangler d1 execute … --local --file=schema.sql`. For prod, write a migration SQL file (don't lose data) and apply with `--remote`.
- **New agent persona** (`/agents` only) — edit the `teams` array in `AgentsPage.tsx`. No backend wiring needed.
- **Styling** — everything lives in `App.css`. There's no Tailwind, no CSS modules.
- **Models** — Claude calls use `claude-haiku-4-5-20251001` (cheapest, fastest). Bump only if reasoning quality matters; this is a categorise+summarise task.
