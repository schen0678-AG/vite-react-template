import { useEffect, useState } from "react";
import type {
  DashboardSummary,
  LeadsByDay,
  ConversionStats,
  SalesByPerson,
} from "../types";
import { SALESPEOPLE, SALESPERSON_COLORS } from "../types";

const colorFor = (person: string): string =>
  (SALESPERSON_COLORS as Record<string, string>)[person] ?? "#94a3b8";

const aud = (v: number): string =>
  v.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

const audCompact = (v: number): string => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1000)}K`;
  return aud(v);
};

const dayLabel = (iso: string): string => {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leadsByDay, setLeadsByDay] = useState<LeadsByDay[]>([]);
  const [conv, setConv] = useState<ConversionStats | null>(null);
  const [sales, setSales] = useState<SalesByPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, l, c, sp] = await Promise.all([
          fetch("/api/dashboard/summary").then((r) => r.json()),
          fetch("/api/dashboard/leads-by-day?days=14").then((r) => r.json()),
          fetch("/api/dashboard/conversion?days=14").then((r) => r.json()),
          fetch("/api/dashboard/sales-by-person").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setSummary(s as DashboardSummary);
        setLeadsByDay(l as LeadsByDay[]);
        setConv(c as ConversionStats);
        setSales(sp as SalesByPerson[]);
      } catch {
        if (!cancelled) setError("Could not load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="empty-state">Loading dashboard...</p>;
  if (error)
    return (
      <div
        className="feedback-card"
        style={{ borderColor: "#fecaca", background: "#fef2f2" }}
      >
        <p className="feedback-text" style={{ color: "#b91c1c" }}>{error}</p>
      </div>
    );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SummaryCards summary={summary} />
      <LeadsByDayChart data={leadsByDay} />
      <ConversionCard stats={conv} />
      <SalesByPersonCard rows={sales} />
    </div>
  );
}

/* ── KPI cards row ─────────────────────────────────────────── */

function SummaryCards({ summary }: { summary: DashboardSummary | null }) {
  if (!summary) return null;
  const items: { label: string; value: number; color: string; icon: string }[] = [
    { label: "Leads",         value: summary.leads,    color: "#f59e0b", icon: "◎" },
    { label: "Contacts",      value: summary.contacts, color: "#0ea5e9", icon: "♟" },
    { label: "Sales Pipeline",value: summary.pipeline, color: "#10b981", icon: "❖" },
    { label: "Accounts",      value: summary.accounts, color: "#475569", icon: "▤" },
  ];
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            background: "white",
            border: `1px solid ${it.color}33`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ color: it.color, fontSize: 14 }}>{it.icon}</span>
            {it.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
            {it.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stacked bar chart: leads/day × salesperson ───────────── */

function LeadsByDayChart({ data }: { data: LeadsByDay[] }) {
  const totals = data.map((d) =>
    Object.values(d.byPerson).reduce((a, b) => a + b, 0)
  );
  const maxY = Math.max(4, ...totals);
  const total = totals.reduce((a, b) => a + b, 0);

  const W = 720;
  const H = 220;
  const padL = 28;
  const padR = 12;
  const padT = 8;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const bandW = data.length ? innerW / data.length : 0;
  const barW = Math.min(28, bandW * 0.6);

  const people = Array.from(
    new Set(data.flatMap((d) => Object.keys(d.byPerson)))
  ).sort((a, b) => SALESPEOPLE.indexOf(a as never) - SALESPEOPLE.indexOf(b as never));

  const ticks = [0, Math.ceil(maxY / 2), maxY];

  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#f97316" }}>◔</span> New Leads by Salesperson
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            Daily new lead capture across the team — last 14 days
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>leads in window</div>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ minWidth: 480, display: "block", fontSize: 11, color: "var(--text-secondary)" }}
        >
          {ticks.map((t) => {
            const y = padT + innerH - (t / maxY) * innerH;
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fill="currentColor">{t}</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = padL + i * bandW + (bandW - barW) / 2;
            let cum = 0;
            const segs = people.map((p) => {
              const v = d.byPerson[p] ?? 0;
              const seg = {
                p,
                v,
                y: padT + innerH - ((cum + v) / maxY) * innerH,
                h: (v / maxY) * innerH,
              };
              cum += v;
              return seg;
            });
            return (
              <g key={d.date}>
                {segs.map(
                  (s) =>
                    s.v > 0 && (
                      <rect
                        key={s.p}
                        x={x}
                        y={s.y}
                        width={barW}
                        height={s.h}
                        fill={colorFor(s.p)}
                        rx={2}
                      >
                        <title>{`${s.p} — ${s.v} on ${d.date}`}</title>
                      </rect>
                    )
                )}
                {i % Math.ceil(data.length / 7) === 0 && (
                  <text
                    x={x + barW / 2}
                    y={H - 8}
                    textAnchor="middle"
                    fill="currentColor"
                  >
                    {dayLabel(d.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        {people.map((p) => (
          <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: colorFor(p), display: "inline-block" }} />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Conversion rate card ─────────────────────────────────── */

function ConversionCard({ stats }: { stats: ConversionStats | null }) {
  if (!stats) return null;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#f97316" }}>⤴</span> Lead Conversion Rate
      </h2>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 12px" }}>
        % of leads that progressed to a sales pipeline
      </p>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: "#f97316" }}>
          {pct(stats.windowRate)}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>last {stats.windowDays} days</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--text)", margin: "4px 0 16px" }}>
        <strong>{stats.windowConverted}</strong> of <strong>{stats.windowLeads}</strong> new leads converted
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        <KpiBlock label="ALL-TIME RATE"      value={pct(stats.allTimeRate)} />
        <KpiBlock label="ALL-TIME CONVERTED" value={`${stats.allTimeConverted} / ${stats.allTimeLeads}`} />
      </div>
    </div>
  );
}

function KpiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* ── Sales & commission by salesperson ────────────────────── */

function SalesByPersonCard({ rows }: { rows: SalesByPerson[] }) {
  const totalCommission = rows.reduce((acc, r) => acc + (r.commission ?? 0), 0);
  const totalWon = rows.reduce((acc, r) => acc + (r.wonValue ?? 0), 0);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#10b981" }}>$</span> Sales & Commission by Salesperson
      </h2>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 12px" }}>
        Won deals drive commission · open pipeline shown for context
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <KpiBlock label="TOTAL WON"        value={audCompact(totalWon)} />
        <KpiBlock label="TOTAL COMMISSION" value={audCompact(totalCommission)} />
      </div>

      {rows.length === 0 ? (
        <p className="empty-state">No deals yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => (
            <div
              key={r.salesperson}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 6,
                padding: 12,
                background: "#f8fafc",
                borderRadius: 10,
                borderLeft: `3px solid ${colorFor(r.salesperson)}`,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{r.salesperson}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  {r.wonCount} won · pipeline {audCompact(r.pipelineValue)} · weighted {audCompact(r.weightedValue)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>
                  {audCompact(r.wonValue)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  commission {audCompact(r.commission)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
