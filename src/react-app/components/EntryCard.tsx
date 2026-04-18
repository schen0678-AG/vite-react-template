import { Entry, CATEGORIES } from "../types";

interface EntryCardProps {
  entry: Entry;
  onDelete: (id: number) => void;
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const cat = CATEGORIES[entry.category] || CATEGORIES.idea_note;
  const isZh = entry.language === "zh-CN";
  const label = isZh ? cat.zh : cat.en;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString(isZh ? "zh-CN" : "en-AU", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="entry-card">
      <div className="entry-header">
        <span
          className="category-badge"
          style={{ background: cat.bg, color: cat.color }}
        >
          {label}
        </span>
        <span className="entry-date">{formatDate(entry.created_at)}</span>
        <button
          className="delete-btn"
          onClick={() => onDelete(entry.id)}
          title="Delete"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {entry.title && <h3 className="entry-title">{entry.title}</h3>}
      <p className="entry-text">{entry.text}</p>
      <p className="entry-feedback">{entry.feedback}</p>
    </div>
  );
}
