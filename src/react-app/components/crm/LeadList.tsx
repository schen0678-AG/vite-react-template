import { useState, useEffect, useCallback } from "react";
import type { Lead, LeadStatus } from "../../types";
import { LEAD_STATUSES } from "../../types";
import LeadCard from "./LeadCard";

interface LeadListProps {
  refreshKey: number;
}

export default function LeadList({ refreshKey }: LeadListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/leads" : `/api/leads?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setLeads(data as Lead[]);
    } catch {
      console.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch {
      console.error("Failed to delete lead");
    }
  };

  const handleStatusChange = async (id: number, status: LeadStatus) => {
    // optimistic update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      console.error("Failed to update lead status");
      fetchLeads();
    }
  };

  return (
    <div className="history">
      <div className="history-header">
        <h2>Leads</h2>
        <span className="entry-count">{leads.length}</span>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {LEAD_STATUSES.map((s) => (
          <button
            key={s.key}
            className={`filter-btn ${filter === s.key ? "active" : ""}`}
            onClick={() => setFilter(s.key)}
            style={filter === s.key ? { background: s.bg, color: s.color } : undefined}
          >
            {s.key}
          </button>
        ))}
      </div>

      <div className="entry-list">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : leads.length === 0 ? (
          <p className="empty-state">
            No leads yet. Capture one above with your voice or by typing.
          </p>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
