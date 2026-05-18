import { useState, useEffect, useCallback } from "react";
import type { Contact } from "../../types";

interface ContactListProps {
  refreshKey: number;
}

const sourceBadge: Record<Contact["source"], { label: string; color: string; bg: string }> = {
  manual:    { label: "Manual",    color: "#475569", bg: "#f1f5f9" },
  voice:     { label: "Voice",     color: "#6366f1", bg: "#eef2ff" },
  card_scan: { label: "Card scan", color: "#0ea5e9", bg: "#e0f2fe" },
};

const formatDate = (s: string, lang: string): string => {
  const d = new Date(s + "Z");
  return d.toLocaleDateString(lang === "zh-CN" ? "zh-CN" : "en-AU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ContactList({ refreshKey }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/contacts?search=${encodeURIComponent(search)}`
        : "/api/contacts";
      const res = await fetch(url);
      setContacts((await res.json()) as Contact[]);
    } catch {
      console.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchContacts, 200);
    return () => clearTimeout(t);
  }, [fetchContacts, refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      console.error("Failed to delete contact");
    }
  };

  return (
    <div className="history">
      <div className="history-header">
        <h2>Contacts</h2>
        <span className="entry-count">{contacts.length}</span>
      </div>

      <input
        type="search"
        placeholder="Search by name, company, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 14,
          marginBottom: 12,
        }}
      />

      <div className="entry-list">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : contacts.length === 0 ? (
          <p className="empty-state">
            No contacts yet. Type or scan a business card above.
          </p>
        ) : (
          contacts.map((c) => {
            const src = sourceBadge[c.source];
            return (
              <div key={c.id} className="entry-card">
                <div className="entry-header">
                  <span
                    className="category-badge"
                    style={{ background: src.bg, color: src.color }}
                  >
                    {src.label}
                  </span>
                  <span className="entry-date">{formatDate(c.created_at, c.language)}</span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(c.id)}
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
                <h3 className="entry-title">
                  {c.name}
                  {c.title && (
                    <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
                      {" · "}{c.title}
                    </span>
                  )}
                </h3>
                {c.company && <p className="entry-text">🏢 {c.company}</p>}
                {(c.email || c.phone || c.wechat) && (
                  <p
                    className="entry-text"
                    style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}
                  >
                    {c.email && (
                      <a href={`mailto:${c.email}`} style={{ color: "var(--accent)" }}>
                        ✉ {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} style={{ color: "var(--accent)" }}>
                        ☎ {c.phone}
                      </a>
                    )}
                    {c.wechat && <span>💬 {c.wechat}</span>}
                  </p>
                )}
                {c.address && (
                  <p className="entry-text" style={{ fontSize: 13 }}>
                    📍 {c.address}
                  </p>
                )}
                {c.notes && <p className="entry-feedback">{c.notes}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
