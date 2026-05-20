import NavBar from "./NavBar";

export default function SecurityPage() {
  return (
    <div className="landing">
      <NavBar />

      {/* ── Hero ── */}
      <section className="hero sec-hero">
        <div className="hero-container">
          <div className="hero-badge">🔒 Enterprise-grade security</div>
          <h1 className="hero-title">
            Your data is in<span className="hero-gradient"> safe hands.</span>
          </h1>
          <p className="hero-subtitle">
            We&apos;ve built this platform on the same security foundation used by
            Australia&apos;s largest banks, telcos and government agencies — so
            you don&apos;t have to worry.
          </p>
          <div className="hero-actions">
            <a href="#pillars" className="btn-primary">See the 6 Pillars</a>
            <a href="mailto:hello@agenlytics.ai?subject=Security%20review" className="btn-secondary">
              Book a Security Review
            </a>
          </div>
        </div>
      </section>

      {/* ── 4 Pillars ── */}
      <section className="sec-pillars-section" id="pillars">
        <div className="section-container">
          <div className="section-header">
            <h2>The 6 pillars protecting your business</h2>
            <p>Plain English. No jargon. Here&apos;s exactly how we keep your data safe.</p>
          </div>

          <div className="sec-pillars-grid">
            {/* Pillar 1 */}
            <div className="sec-pillar">
              <div className="sec-pillar-number">01</div>
              <div className="sec-pillar-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>📡</div>
              <h3>Built by telecom cyber security experts</h3>
              <p>
                Our architecture is designed by experts from{" "}
                <strong>Australia&apos;s biggest telcos</strong> — Telstra, TPG
                and NBN — who built the systems trusted by millions of
                Australians every day. We follow the same cyber security
                standards used inside the telecom industry, which are among the
                strictest in the country.
              </p>
              <div className="sec-pillar-chips">
                <span className="sec-chip">Telstra</span>
                <span className="sec-chip">TPG</span>
                <span className="sec-chip">NBN</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="sec-pillar">
              <div className="sec-pillar-number">02</div>
              <div className="sec-pillar-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>🔑</div>
              <h3>No passwords. Google Sign-In only.</h3>
              <p>
                Most data breaches start with stolen passwords. We&apos;ve
                removed that risk entirely — you sign in with your existing
                Google account, the same way you sign in to Gmail. This is
                called a <strong>&ldquo;Zero Trust&rdquo;</strong> approach, and
                it&apos;s the standard now used by banks and tech giants
                worldwide.
              </p>
              <div className="sec-pillar-callout">
                💡 If you don&apos;t have a password, no one can steal it.
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="sec-pillar">
              <div className="sec-pillar-number">03</div>
              <div className="sec-pillar-icon" style={{ background: "#fef3c7", color: "#d97706" }}>☁️</div>
              <h3>Built on AWS — the cloud banks and government trust</h3>
              <p>
                Our entire platform runs on <strong>Amazon Web Services
                (AWS)</strong> — the world&apos;s #1 cloud, trusted by the
                Australian Bureau of Statistics (ABS) and used to power
                Commonwealth Bank&apos;s Core Banking System. If it&apos;s good
                enough for Australia&apos;s largest bank and government,
                it&apos;s good enough for your business.
              </p>
              <div className="sec-pillar-chips">
                <span className="sec-chip">Aust. Gov. (ABS)</span>
                <span className="sec-chip">Commonwealth Bank</span>
                <span className="sec-chip">AWS Cloud</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="sec-pillar">
              <div className="sec-pillar-number">04</div>
              <div className="sec-pillar-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>🔄</div>
              <h3>Role-based access. Secrets that rotate.</h3>
              <p>
                Instead of usernames and passwords sitting on a server, every
                user is granted a specific <strong>role inside AWS</strong> —
                meaning they only see what they need to. And every secret key
                the system uses is{" "}
                <strong>automatically rotated every 90 days</strong> — the
                highest standard in the telecom industry. Even if a key were
                ever exposed, it would be invalid within weeks.
              </p>
              <div className="sec-rotation">
                <div className="sec-rotation-circle">
                  <span className="sec-rotation-num">90</span>
                  <span className="sec-rotation-label">days</span>
                </div>
                <span className="sec-rotation-text">
                  Every secret key auto-rotates on this cycle.
                </span>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="sec-pillar">
              <div className="sec-pillar-number">05</div>
              <div className="sec-pillar-icon" style={{ background: "#fce7f3", color: "#db2777" }}>🛠️</div>
              <h3>Built by Senior IT consultants with 15+ years&apos; experience.</h3>
              <p>
                This platform isn&apos;t a weekend hackathon. It&apos;s built by
                Senior IT consultants with{" "}
                <strong>over 15 years designing and securing enterprise
                systems</strong> for some of Australia&apos;s most demanding
                industries — mining, energy, telecom and consumer goods. Security
                isn&apos;t a checkbox here. It&apos;s a habit built across
                hundreds of engagements.
              </p>
              <div className="sec-pillar-chips">
                <span className="sec-chip">EnergyAustralia</span>
                <span className="sec-chip">Rio Tinto</span>
                <span className="sec-chip">Glencore</span>
                <span className="sec-chip">Orica</span>
                <span className="sec-chip">Telstra</span>
                <span className="sec-chip">Mars</span>
              </div>
            </div>

            {/* Pillar 6 */}
            <div className="sec-pillar">
              <div className="sec-pillar-number">06</div>
              <div className="sec-pillar-icon" style={{ background: "#e2e8f0", color: "#334155" }}>⚖️</div>
              <h3>Legal protection. NDA on every engagement.</h3>
              <p>
                Before we touch a single byte of your data, we sign a{" "}
                <strong>Non-Disclosure Agreement (NDA)</strong> with you — the
                same legal protection you&apos;d expect from any reputable IT
                consultancy. We&apos;re contractually bound to handle your data
                with the confidentiality and duty of care{" "}
                <strong>required of any IT services provider in Australia</strong>.
                If something ever goes wrong, you have recourse — not just our
                word.
              </p>
              <div className="sec-pillar-callout">
                📝 NDA signed before any engagement begins.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Production-proven Stack ── */}
      <section className="sec-stack-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="sec-stack-title">Production-proven security stack</h2>
            <p className="sec-stack-sub">
              This isn&apos;t a prototype. It&apos;s the same security
              architecture already running in production at a wholesale company
              with tens of millions in annual sales revenue.
            </p>
          </div>

          <div className="sec-stack-grid">
            <div className="sec-stack-item">
              <div className="sec-stack-icon">🪪</div>
              <strong>Google Identity</strong>
              <p>OAuth 2.0 sign-in. No passwords on our servers, ever.</p>
            </div>
            <div className="sec-stack-item">
              <div className="sec-stack-icon">🛡️</div>
              <strong>AWS IAM Roles</strong>
              <p>Fine-grained, least-privilege access enforced at the cloud layer.</p>
            </div>
            <div className="sec-stack-item">
              <div className="sec-stack-icon">🗝️</div>
              <strong>AWS Secrets Manager</strong>
              <p>All credentials stored encrypted, auto-rotated every 90 days.</p>
            </div>
            <div className="sec-stack-item">
              <div className="sec-stack-icon">🔐</div>
              <strong>End-to-End Encryption</strong>
              <p>TLS 1.3 in transit, AES-256 at rest. Nothing travels in the clear.</p>
            </div>
            <div className="sec-stack-item">
              <div className="sec-stack-icon">🏰</div>
              <strong>VPC Isolation</strong>
              <p>Private network boundaries — your workload never touches the public internet.</p>
            </div>
            <div className="sec-stack-item">
              <div className="sec-stack-icon">📜</div>
              <strong>Audit Trail</strong>
              <p>Every action is logged, time-stamped and tamper-evident in CloudTrail.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Still have security questions?</h2>
            <p>
              We&apos;re happy to walk through our architecture with your IT
              team — line by line. No NDA gymnastics, no marketing fluff.
            </p>
            <div className="hero-actions">
              <a
                href="mailto:hello@agenlytics.ai?subject=Security%20deep-dive"
                className="btn-primary"
              >
                Book a Security Deep-Dive
              </a>
              <a href="/" className="btn-secondary">Back to Home</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-bottom">
            <a href="/" className="nav-logo">
              <span className="logo-icon">A</span>
              <span className="logo-text">Agenlytics Labs</span>
            </a>
            <p>&copy; 2026 Agenlytics Labs &middot; Melbourne, Australia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
