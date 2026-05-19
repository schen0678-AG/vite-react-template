import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useAuth, GoogleSignInButton } from "../auth";

export default function LandingPage() {
  const { user, signOut, authError } = useAuth();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // After sign-in succeeds *and* the server allowlist accepts, navigate to the
  // page the user was trying to reach. If the server rejects, authError is set
  // and we keep them on the landing page so they can see the message.
  useEffect(() => {
    if (user && !authError && pendingHref) {
      const href = pendingHref;
      setPendingHref(null);
      window.location.href = href;
    }
  }, [user, authError, pendingHref]);

  const guard = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (user) return; // signed in → let the link navigate
    e.preventDefault();
    setPendingHref(href);
  };

  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <div className="nav-links">
            <a href="#platform">Data &amp; Agent Fusion Platform</a>
            <a href="/agents">Meet the Agent Team</a>
            <a href="/security">Security</a>
            <a href="/crm" onClick={guard("/crm")}>Try Voice CRM</a>
            <a href="/assistant" onClick={guard("/assistant")} className="nav-cta">
              Try Personal Assistant
            </a>
            {user ? (
              <span className="nav-user" title={user.email}>
                {user.picture && (
                  <img
                    src={user.picture}
                    alt=""
                    className="nav-user-avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="nav-user-name">{user.name.split(" ")[0]}</span>
                <button className="nav-user-signout" onClick={signOut}>
                  Sign out
                </button>
              </span>
            ) : null}
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
            <a href="/assistant" onClick={guard("/assistant")} className="btn-secondary">Try the Assistant</a>
            <a href="/crm" onClick={guard("/crm")} className="btn-secondary">Try Voice CRM</a>
          </div>
        </div>
      </section>

      <section className="arch-section" id="platform">
        <ArchDiagram />
      </section>

      {/* Security assurance */}
      <a href="/security" className="security-bar security-bar-link">
        <div className="security-inner">
          <div className="security-icon">🔒</div>
          <div className="security-text">
            <strong>Your data stays within your own IT landscape.</strong>
            <span>All processing happens inside your infrastructure. No data is sent to external servers. Full encryption, SSO, role-based access, and audit trails by default. <em>Read the full security overview →</em></span>
          </div>
        </div>
      </a>

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
              <a href="/assistant" onClick={guard("/assistant")} className="btn-secondary">Try the Assistant</a>
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

      {pendingHref && (
        <SignInModal
          destination={pendingHref}
          authError={authError}
          onClose={() => setPendingHref(null)}
        />
      )}
    </div>
  );
}

function SignInModal({
  destination,
  authError,
  onClose,
}: {
  destination: string;
  authError: string | null;
  onClose: () => void;
}) {
  const label =
    destination === "/assistant"
      ? "Personal Assistant"
      : destination === "/crm"
        ? "Voice CRM"
        : destination === "/dashboard"
          ? "Dashboard"
          : "this use case";

  return (
    <div className="signin-modal-backdrop" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="signin-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {authError ? (
          <>
            <h3>Account not authorized</h3>
            <p className="auth-error">{authError}</p>
            <p>Sign in with a different Google account to continue.</p>
          </>
        ) : (
          <>
            <h3>Sign in to try {label}</h3>
            <p>We use Google sign-in — no password to remember.</p>
          </>
        )}
        <div className="signin-modal-button">
          <GoogleSignInButton text="continue_with" size="large" />
        </div>
        <p className="signin-modal-fine">
          By continuing you agree to let Agenlytics Labs see your basic profile info (name, email).
        </p>
      </div>
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
