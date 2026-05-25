import { useEffect, useState } from "react";
import type { AssistantOp } from "../../types";

interface Props {
  reply: string;
  ops: AssistantOp[];
  // When this changes, the strip refreshes its auto-dismiss timer.
  turnNonce: number;
}

const DISMISS_MS = 12000;

function describeOp(op: AssistantOp): string {
  switch (op.kind) {
    case "project_created":   return `Created project "${op.name}"`;
    case "project_updated":   return `Updated project "${op.name}"`;
    case "project_deleted":   return `Deleted project "${op.name}"`;
    case "feature_created":   return `Added feature "${op.summary}" to "${op.project_name}"`;
    case "feature_updated":   return `Updated feature "${op.summary}"`;
    case "feature_deleted":   return `Deleted feature "${op.summary}"`;
    case "todo_created":      return `Added todo "${op.action}"${op.due_at ? ` (${new Date(op.due_at).toLocaleString()})` : ""}`;
    case "todo_updated":      return `Updated todo "${op.action}"`;
    case "todo_completed":    return `Completed todo "${op.action}"`;
    case "todo_deleted":      return `Deleted todo "${op.action}"`;
  }
}

export default function LastTurnStrip({ reply, ops, turnNonce }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!reply && ops.length === 0) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), DISMISS_MS);
    return () => clearTimeout(t);
  }, [reply, ops, turnNonce]);

  if (!visible) return null;
  return (
    <div className="asst-last-turn" role="status">
      <div className="asst-last-turn-reply">{reply}</div>
      {ops.length > 0 && (
        <ul className="asst-last-turn-ops">
          {ops.map((op, i) => (
            <li key={i}>{describeOp(op)}</li>
          ))}
        </ul>
      )}
      <button
        className="asst-last-turn-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
