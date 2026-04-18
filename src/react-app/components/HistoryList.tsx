import { useState, useEffect, useCallback } from "react";
import { Entry, EntryCategory, ALL_CATEGORIES, CATEGORIES } from "../types";
import EntryCard from "./EntryCard";

interface HistoryListProps {
  refreshKey: number;
}

export default function HistoryList({ refreshKey }: HistoryListProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<EntryCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all" ? "/api/entries" : `/api/entries?category=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data as Entry[]);
    } catch {
      console.error("Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/entries/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      console.error("Failed to delete entry");
    }
  };

  return (
    <div className="history">
      <div className="history-header">
        <h2>History</h2>
        <span className="entry-count">{entries.length}</span>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? "active" : ""}`}
            onClick={() => setFilter(cat)}
            style={
              filter === cat
                ? { background: CATEGORIES[cat].bg, color: CATEGORIES[cat].color }
                : undefined
            }
          >
            {CATEGORIES[cat].en}
          </button>
        ))}
      </div>

      <div className="entry-list">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="empty-state">
            No entries yet. Start speaking or typing above.
          </p>
        ) : (
          entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
