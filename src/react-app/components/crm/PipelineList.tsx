import { useState, useEffect, useCallback } from "react";
import type { Deal, DealStage } from "../../types";
import { DEAL_STAGES } from "../../types";

interface Props {
  refreshKey: number;
}

const formatCurrency = (v: number | null, lang: string): string => {
  if (v == null) return "—";
  return v.toLocaleString(lang === "zh-CN" ? "zh-CN" : "en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
};

const stageMeta = (s: DealStage) =>
  DEAL_STAGES.find((x) => x.key === s) ?? DEAL_STAGES[0];

export default function PipelineList({ refreshKey }: Props) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deals");
      setDeals((await res.json()) as Deal[]);
    } catch {
      console.error("Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals, refreshKey]);

  const updateStage = async (id: number, stage: DealStage) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
    } catch {
      fetchDeals();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/deals/${id}`, { method: "DELETE" });
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } catch {
      console.error("Failed to delete deal");
    }
  };

  // KPIs
  const pipelineValue = deals
    .filter((d) => d.stage !== "Lost")
    .reduce((acc, d) => acc + (d.deal_value ?? 0), 0);
  const weightedValue = deals
    .filter((d) => d.stage !== "Lost" && d.stage !== "Won")
    .reduce((acc, d) => acc + ((d.deal_value ?? 0) * d.probability) / 100, 0);
  const wonValue = deals
    .filter((d) => d.stage === "Won")
    .reduce((acc, d) => acc + (d.deal_value ?? 0), 0);

  return (
    <div className="history">
      <div className="history-header">
        <h2>Sales Pipeline</h2>
        <span className="entry-count">{deals.length}</span>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Kpi label="Pipeline" value={formatCurrency(pipelineValue, "en-AU")} color="#6366f1" />
        <Kpi label="Weighted" value={formatCurrency(weightedValue, "en-AU")} color="#0ea5e9" />
        <Kpi label="Won (AUD)" value={formatCurrency(wonValue, "en-AU")} color="#10b981" />
      </div>

      <div className="entry-list">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : deals.length === 0 ? (
          <p className="empty-state">
            No deals yet. Convert a qualified lead from the Leads tab.
          </p>
        ) : (
          deals.map((d) => {
            const meta = stageMeta(d.stage);
            return (
              <div key={d.id} className="entry-card">
                <div className="entry-header">
                  <select
                    className="category-badge"
                    value={d.stage}
                    onChange={(e) => updateStage(d.id, e.target.value as DealStage)}
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
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.key}
                      </option>
                    ))}
                  </select>
                  <span className="entry-date">
                    {d.expected_close_date
                      ? `Close ${d.expected_close_date}`
                      : `Created ${new Date(d.created_at + "Z").toLocaleDateString()}`}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(d.id)}
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

                <h3 className="entry-title">{d.name}</h3>

                <p
                  className="entry-text"
                  style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                >
                  {d.contact_name && <span>👤 {d.contact_name}</span>}
                  {d.company && <span>🏢 {d.company}</span>}
                  <span style={{ color: "#059669", fontWeight: 600 }}>
                    💰 {formatCurrency(d.deal_value, d.language)}
                  </span>
                  <span style={{ color: meta.color }}>{d.probability}%</span>
                </p>

                {d.notes && <p className="entry-feedback">{d.notes}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
