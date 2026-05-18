import { useState } from "react";
import type { Lead, Deal, DealStage } from "../../types";
import { DEAL_STAGES, PROBABILITY_OPTIONS } from "../../types";

interface Props {
  lead: Lead;
  onClose: () => void;
  onConverted: (deal: Deal) => void;
}

const defaultClose = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

export default function ConvertLeadModal({ lead, onClose, onConverted }: Props) {
  const [name, setName] = useState(
    lead.company ? `${lead.name} – ${lead.company}` : lead.name
  );
  const [stage, setStage] = useState<DealStage>("New Opportunity");
  const [probability, setProbability] = useState<number>(25);
  const [dealValue, setDealValue] = useState<string>(
    lead.estimated_value != null ? String(lead.estimated_value) : ""
  );
  const [closeDate, setCloseDate] = useState<string>(defaultClose());
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          stage,
          probability,
          deal_value: dealValue ? Number(dealValue) : null,
          expected_close_date: closeDate || null,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to convert");
        return;
      }
      const deal = (await res.json()) as Deal;
      onConverted(deal);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Convert to Deal</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          {lead.name}
          {lead.company && ` · ${lead.company}`} → sales pipeline
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Deal Name *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              style={inputStyle}
            >
              {DEAL_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.key}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Probability">
              <select
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                style={inputStyle}
              >
                {PROBABILITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}%
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deal Value (AUD)">
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Expected Close Date">
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            className="submit-btn"
            onClick={submit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Converting..." : "Convert →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
      {label}
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 14,
  color: "var(--text)",
  fontFamily: "inherit",
};
