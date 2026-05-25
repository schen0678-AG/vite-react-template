import { useMemo } from "react";
import type { AssistantTodo, AssistantProject } from "../../types";

interface Props {
  todos: AssistantTodo[];
  projects: AssistantProject[];
  highlightedTodoIds: Set<number>;
  onToggle: (id: number, nextDone: boolean) => void;
  onDelete: (id: number) => void;
}

type Bucket =
  | "Overdue"
  | "Today"
  | "Tomorrow"
  | "This week"
  | "Later"
  | "No date"
  | "Done";

const BUCKET_ORDER: Bucket[] = [
  "Overdue",
  "Today",
  "Tomorrow",
  "This week",
  "Later",
  "No date",
  "Done",
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketOf(todo: AssistantTodo, now: Date): Bucket {
  if (todo.status === "done") return "Done";
  if (!todo.due_at) return "No date";
  const due = new Date(todo.due_at);
  if (Number.isNaN(due.getTime())) return "No date";
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  if (due.getTime() < today.getTime()) return "Overdue";
  if (due.getTime() < tomorrow.getTime()) return "Today";
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
  if (due.getTime() < dayAfterTomorrow.getTime()) return "Tomorrow";
  if (due.getTime() < endOfWeek.getTime()) return "This week";
  return "Later";
}

function formatDue(due_at: string | null, language: string): string {
  if (!due_at) return "";
  const d = new Date(due_at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(language === "zh-CN" ? "zh-CN" : "en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TodosPanel({
  todos,
  projects,
  highlightedTodoIds,
  onToggle,
  onDelete,
}: Props) {
  const now = useMemo(() => new Date(), []);
  const projectName = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of projects) m.set(p.id, p.name);
    return m;
  }, [projects]);

  const buckets = useMemo(() => {
    const map: Record<Bucket, AssistantTodo[]> = {
      Overdue: [], Today: [], Tomorrow: [], "This week": [],
      Later: [], "No date": [], Done: [],
    };
    for (const t of todos) {
      if (t.status === "cancelled") continue;
      map[bucketOf(t, now)].push(t);
    }
    // Sort each bucket by due_at ascending; nulls last.
    for (const b of BUCKET_ORDER) {
      map[b].sort((a, c) => {
        if (!a.due_at && !c.due_at) return 0;
        if (!a.due_at) return 1;
        if (!c.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(c.due_at).getTime();
      });
    }
    return map;
  }, [todos, now]);

  const total = todos.filter((t) => t.status !== "cancelled").length;

  return (
    <section className="asst-panel">
      <h2 className="asst-panel-title">
        Todos <span className="asst-count">{total}</span>
      </h2>
      {total === 0 ? (
        <p className="asst-empty">
          Nothing scheduled. Try: "Remind me to email Sarah tomorrow at 6am."
        </p>
      ) : (
        BUCKET_ORDER.map((bucket) => {
          const items = buckets[bucket];
          if (items.length === 0) return null;
          return (
            <div key={bucket} className={`asst-bucket asst-bucket-${bucket.replace(/\s+/g, "-").toLowerCase()}`}>
              <h3 className="asst-bucket-title">{bucket}</h3>
              <ul className="asst-todos">
                {items.map((t) => {
                  const lang = t.due_at && /[一-鿿]/.test(t.action + t.target) ? "zh-CN" : "en-US";
                  return (
                    <li
                      key={t.id}
                      className={`asst-todo ${t.status === "done" ? "asst-todo-done" : ""} ${highlightedTodoIds.has(t.id) ? "asst-todo-new" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={t.status === "done"}
                        onChange={(e) => onToggle(t.id, e.target.checked)}
                        aria-label={t.action}
                      />
                      <div className="asst-todo-body">
                        <div className="asst-todo-line">
                          <span className="asst-todo-action">{t.action}</span>
                          {t.target && (
                            <span className="asst-todo-target"> · {t.target}</span>
                          )}
                        </div>
                        <div className="asst-todo-meta">
                          {t.due_at && (
                            <span className="asst-todo-due">{formatDue(t.due_at, lang)}</span>
                          )}
                          {t.project_id && projectName.get(t.project_id) && (
                            <span className="asst-todo-project">
                              · {projectName.get(t.project_id)}
                            </span>
                          )}
                          {t.notes && <span className="asst-todo-notes"> · {t.notes}</span>}
                        </div>
                      </div>
                      <button
                        className="asst-icon-btn"
                        onClick={() => onDelete(t.id)}
                        title="Delete todo"
                        aria-label="Delete todo"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
