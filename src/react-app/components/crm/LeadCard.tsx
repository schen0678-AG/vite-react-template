import type { Lead, LeadStatus } from "../../types";
import { LEAD_STATUSES } from "../../types";

interface LeadCardProps {
  lead: Lead;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: LeadStatus) => void;
}

const statusMeta = (s: LeadStatus) =>
  LEAD_STATUSES.find((x) => x.key === s) ?? LEAD_STATUSES[0];

const formatValue = (v: number | null, lang: string): string | null => {
  if (v == null) return null;
  const isZh = lang === "zh-CN";
  return v.toLocaleString(isZh ? "zh-CN" : "en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
};

const formatDate = (s: string, lang: string): string => {
  const d = new Date(s + "Z");
  const isZh = lang === "zh-CN";
  return d.toLocaleDateString(isZh ? "zh-CN" : "en-AU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LeadCard({ lead, onDelete, onStatusChange }: LeadCardProps) {
  const meta = statusMeta(lead.status);
  const value = formatValue(lead.estimated_value, lead.language);

  return (
    <div className="entry-card">
      <div className="entry-header">
        <select
          className="category-badge"
          style={{
            background: meta.bg,
            color: meta.color,
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.key}
            </option>
          ))}
        </select>
        <span className="entry-date">{formatDate(lead.created_at, lead.language)}</span>
        <button className="delete-btn" onClick={() => onDelete(lead.id)} title="Delete">
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
        {lead.name}
        {lead.title && (
          <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
            {" · "}{lead.title}
          </span>
        )}
      </h3>

      {(lead.company || value) && (
        <p className="entry-text" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {lead.company && <span>🏢 {lead.company}</span>}
          {value && <span style={{ color: "#059669", fontWeight: 600 }}>💰 {value}</span>}
        </p>
      )}

      {(lead.email || lead.phone) && (
        <p
          className="entry-text"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}
        >
          {lead.email && (
            <a href={`mailto:${lead.email}`} style={{ color: "var(--accent)" }}>
              ✉ {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={{ color: "var(--accent)" }}>
              ☎ {lead.phone}
            </a>
          )}
        </p>
      )}

      {lead.product_interest && (
        <p className="entry-text" style={{ fontSize: 13 }}>
          🎯 {lead.product_interest}
        </p>
      )}

      {lead.summary && <p className="entry-feedback">{lead.summary}</p>}
    </div>
  );
}
