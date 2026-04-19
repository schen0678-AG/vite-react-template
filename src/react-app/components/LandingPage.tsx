import { useEffect, useRef } from "react";

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <div className="nav-links">
            <a href="#platform">Platform</a>
            <a href="/agents">Agents</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#contact">Contact</a>
            <a href="/assistant" className="nav-cta">Try Assistant</a>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge">Agent + Analytics = Agenlytics</div>
          <h1 className="hero-title">AI agents powered by<span className="hero-gradient"> your data.</span></h1>
          <p className="hero-subtitle">We fuse autonomous AI agents with a unified data platform. Your systems feed the data. Our agents deliver the action.</p>
          <div className="hero-actions">
            <a href="#platform" className="btn-primary">See How It Works</a>
            <a href="/assistant" className="btn-secondary">Try the Assistant</a>
          </div>
        </div>
      </section>

      <section className="arch-section" id="platform">
        <ArchDiagram />
      </section>

      {/* Security assurance */}
      <section className="security-bar">
        <div className="security-inner">
          <div className="security-icon">🔒</div>
          <div className="security-text">
            <strong>Your data stays within your own IT landscape.</strong>
            <span>All processing happens inside your infrastructure. No data is sent to external servers. Full encryption, SSO, role-based access, and audit trails by default.</span>
          </div>
        </div>
      </section>

      <section className="unlock-section" id="use-cases">
        <div className="section-container">
          <div className="section-header"><h2>What you unlock</h2></div>
          <div className="unlock-grid">
            <div className="unlock-card"><div className="unlock-icon">📊</div><h3>Sales Intelligence</h3><p>Automated performance packs, trend analysis, and pipeline monitoring.</p></div>
            <div className="unlock-card"><div className="unlock-icon">💰</div><h3>AR Collections</h3><p>AI-drafted reminders with human approval. Tiered escalation.</p></div>
            <div className="unlock-card"><div className="unlock-icon">🔍</div><h3>Data Reconciliation</h3><p>Cross-reference inventory, orders, and warehouses automatically.</p></div>
            <div className="unlock-card"><div className="unlock-icon">📋</div><h3>Executive Decks</h3><p>Board-ready PowerPoint reports generated on command.</p></div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="contact">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to see it in action?</h2>
            <p>Book a call or try the live assistant &mdash; built on the same platform.</p>
            <div className="hero-actions">
              <a href="mailto:hello@agenlytics.ai" className="btn-primary">Get in Touch</a>
              <a href="/assistant" className="btn-secondary">Try the Assistant</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-bottom">
            <a href="/" className="nav-logo"><span className="logo-icon">A</span><span className="logo-text">Agenlytics Labs</span></a>
            <p>&copy; 2026 Agenlytics Labs &middot; Melbourne, Australia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Architecture Diagram ── */

const SOURCES = ["ERP / Accounting", "CRM / Sales", "Inventory / WMS", "Email / Inbox", "APIs / Webhooks", "Spreadsheets"];
const FEATURES = ["AI-Powered Sync", "Intelligent Enrichment", "Unified Data Schema"];
const OUTCOMES = [
  { icon: "📊", color: "#6366f1", label: "Sales Intelligence", sub: "Automated insights" },
  { icon: "💰", color: "#10b981", label: "Collections", sub: "AI-drafted emails" },
  { icon: "🔍", color: "#3b82f6", label: "Reconciliation", sub: "Discrepancy detection" },
  { icon: "📋", color: "#f59e0b", label: "Executive Reports", sub: "Board-ready decks" },
  { icon: "📬", color: "#ec4899", label: "Inbox Intelligence", sub: "Email classification" },
  { icon: "🎯", color: "#14b8a6", label: "Market Insights", sub: "Competitive analysis" },
];

function ArchDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("arch-visible"); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="arch-wrap" ref={ref}>
      {/* Label */}
      <div className="arch-label">YOUR EXISTING SYSTEMS</div>

      {/* Source boxes */}
      <div className="arch-row arch-sources">
        {SOURCES.map((s) => (
          <div key={s} className="arch-src"><span className="arch-src-dot" />{s}</div>
        ))}
      </div>

      {/* Tree lines: sources → horizontal bar → single trunk down */}
      <div className="arch-tree arch-tree-down">
        <div className="arch-tree-branches">
          {SOURCES.map((_, i) => <div key={i} className="arch-branch-v" />)}
        </div>
        <div className="arch-tree-bar" />
        <div className="arch-trunk" />
      </div>

      {/* Platform core */}
      <div className="arch-center">
        <div className="arch-ring">
          <div className="arch-ring-inner">
            <span className="arch-ring-logo">A</span>
            <span className="arch-ring-name">Agenlytics</span>
            <span className="arch-ring-sub">Data Platform</span>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="arch-row arch-features">
        {FEATURES.map((f) => <span key={f} className="arch-feat">{f}</span>)}
      </div>

      {/* Tree lines: single trunk → horizontal bar → outcomes */}
      <div className="arch-tree arch-tree-up">
        <div className="arch-trunk" />
        <div className="arch-tree-bar" />
        <div className="arch-tree-branches">
          {OUTCOMES.map((_, i) => <div key={i} className="arch-branch-v" />)}
        </div>
      </div>

      {/* Label */}
      <div className="arch-label">WHAT AGENTS DELIVER</div>

      {/* Outcome cards */}
      <div className="arch-row arch-outcomes">
        {OUTCOMES.map((o) => (
          <div key={o.label} className="arch-out">
            <div className="arch-out-icon" style={{ background: `${o.color}18`, color: o.color }}>{o.icon}</div>
            <strong>{o.label}</strong>
            <span>{o.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
