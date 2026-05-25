import { useCallback, useEffect, useState } from "react";
import type {
  AssistantState,
  AssistantOp,
  AssistantTurnResult,
} from "../../types";
import { useAuth } from "../../auth";
import AssistantInput from "./AssistantInput";
import ProjectsPanel from "./ProjectsPanel";
import TodosPanel from "./TodosPanel";
import LastTurnStrip from "./LastTurnStrip";

const EMPTY: AssistantState = { projects: [], todos: [] };

function highlightSets(ops: AssistantOp[]) {
  const projects = new Set<number>();
  const features = new Set<number>();
  const todos = new Set<number>();
  for (const op of ops) {
    switch (op.kind) {
      case "project_created":
      case "project_updated":
        projects.add(op.id);
        break;
      case "feature_created":
      case "feature_updated":
        features.add(op.id);
        break;
      case "todo_created":
      case "todo_updated":
      case "todo_completed":
        todos.add(op.id);
        break;
    }
  }
  return { projects, features, todos };
}

export default function AssistantPage() {
  const { user, signOut } = useAuth();
  const [state, setState] = useState<AssistantState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [lastReply, setLastReply] = useState("");
  const [lastOps, setLastOps] = useState<AssistantOp[]>([]);
  const [turnNonce, setTurnNonce] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant/state");
      if (!res.ok) {
        setLoadError(`Failed to load (${res.status})`);
        return;
      }
      const data = (await res.json()) as AssistantState;
      setState(data);
      setLoadError(null);
    } catch {
      setLoadError("Could not reach server");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = useCallback(async (text: string, language: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/assistant/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(err.error || `Turn failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as AssistantTurnResult;
      setState(data.state);
      setLastReply(data.reply);
      setLastOps(data.ops);
      setTurnNonce((n) => n + 1);
    } catch {
      alert("Could not reach server");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleToggleTodo = useCallback(async (id: number, nextDone: boolean) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) =>
        t.id === id ? { ...t, status: nextDone ? "done" : "pending" } : t,
      ),
    }));
    try {
      await fetch(`/api/assistant/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextDone ? "done" : "pending" }),
      });
    } catch {
      // Reload truth on error
      refresh();
    }
  }, [refresh]);

  const handleDeleteTodo = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== id) }));
    try {
      await fetch(`/api/assistant/todos/${id}`, { method: "DELETE" });
    } catch {
      refresh();
    }
  }, [refresh]);

  const handleDeleteProject = useCallback(async (id: number) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      todos: prev.todos.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)),
    }));
    try {
      await fetch(`/api/assistant/projects/${id}`, { method: "DELETE" });
    } catch {
      refresh();
    }
  }, [refresh]);

  const handleDeleteFeature = useCallback(async (id: number) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => ({
        ...p,
        features: p.features.filter((f) => f.id !== id),
      })),
    }));
    try {
      await fetch(`/api/assistant/features/${id}`, { method: "DELETE" });
    } catch {
      refresh();
    }
  }, [refresh]);

  const hi = highlightSets(lastOps);

  return (
    <div className="assistant">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <span className="app-subtitle">Personal Assistant</span>
          {user && (
            <span className="app-header-user" title={user.email}>
              {user.picture && (
                <img
                  src={user.picture}
                  alt=""
                  className="nav-user-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="nav-user-name">{user.name.split(" ")[0]}</span>
              <button className="nav-user-signout" onClick={signOut}>
                Sign out
              </button>
            </span>
          )}
          <a href="/" className="back-link">&larr; Home</a>
        </div>
      </header>

      <main className="app-main asst-main">
        <AssistantInput onSubmit={handleSubmit} busy={busy} />
        <LastTurnStrip reply={lastReply} ops={lastOps} turnNonce={turnNonce} />
        {loadError && <p className="auth-error">{loadError}</p>}
        <div className="asst-grid">
          <ProjectsPanel
            projects={state.projects}
            highlightedFeatureIds={hi.features}
            highlightedProjectIds={hi.projects}
            onDeleteProject={handleDeleteProject}
            onDeleteFeature={handleDeleteFeature}
          />
          <TodosPanel
            todos={state.todos}
            projects={state.projects}
            highlightedTodoIds={hi.todos}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
          />
        </div>
      </main>
    </div>
  );
}
