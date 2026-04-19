export default function LandingPage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics</span>
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#contact">Contact</a>
            <a href="/assistant" className="nav-cta">Try Assistant</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge">AI-Powered Analytics Platform</div>
          <h1 className="hero-title">
            Turn your data into
            <span className="hero-gradient"> intelligent action.</span>
          </h1>
          <p className="hero-subtitle">
            Agenlytics combines agentic AI with deep analytics to help
            organisations automate insights, streamline reporting, and make
            faster decisions &mdash; without the complexity.
          </p>
          <div className="hero-actions">
            <a href="/assistant" className="btn-primary">Try the Assistant</a>
            <a href="#features" className="btn-secondary">Explore Platform</a>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust">
        <div className="trust-container">
          <p className="trust-label">Trusted by forward-thinking organisations</p>
          <div className="trust-logos">
            <span className="trust-item">Financial Services</span>
            <span className="trust-divider" />
            <span className="trust-item">Professional Services</span>
            <span className="trust-divider" />
            <span className="trust-item">Healthcare</span>
            <span className="trust-divider" />
            <span className="trust-item">Enterprise</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2>Everything you need to unlock your data</h2>
            <p>
              From automated reporting to predictive insights, Agenlytics gives
              your team the tools to move from data collection to data-driven
              action.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3>Agentic AI Workflows</h3>
              <p>
                Autonomous AI agents that analyse, summarise, and act on your
                data &mdash; reducing manual effort and accelerating decisions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3>Real-Time Dashboards</h3>
              <p>
                Interactive dashboards that update in real time, giving
                stakeholders a single source of truth across your portfolio.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3>Automated Reporting</h3>
              <p>
                Generate executive-ready reports, slide decks, and board packs
                automatically &mdash; no manual formatting required.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Enterprise Security</h3>
              <p>
                Your data stays yours. Built with SSO integration,
                role-based access, and audit trails by default.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <h3>Pre-Built Connectors</h3>
              <p>
                Connect to your databases, cloud platforms, SaaS tools,
                and APIs &mdash; out of the box.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Predictive Insights</h3>
              <p>
                Forecast trends, flag risks early, and surface anomalies before
                they become problems &mdash; powered by AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2>How Agenlytics works</h2>
            <p>From raw data to executive insight in three steps.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Connect your data</h3>
              <p>
                Plug in your existing databases, ERPs, and project tools.
                Agenlytics normalises everything into a unified data model.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>AI agents get to work</h3>
              <p>
                Autonomous agents process, validate, and enrich your data
                through configurable pipelines &mdash; no coding required.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Insights delivered</h3>
              <p>
                Dashboards, reports, and alerts are generated automatically
                and delivered to the right people at the right time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases" id="use-cases">
        <div className="section-container">
          <div className="section-header">
            <h2>Built for organisations that need clarity</h2>
            <p>See how teams use Agenlytics to transform their operations.</p>
          </div>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <h3>Sales &amp; Revenue Analytics</h3>
              <p>
                Monitor pipeline health, forecast revenue, and identify
                growth opportunities with AI-driven sales intelligence.
              </p>
            </div>
            <div className="use-case-card">
              <h3>Operations &amp; Workforce Planning</h3>
              <p>
                Optimise team capacity, track utilisation, and plan
                resources across projects and business units.
              </p>
            </div>
            <div className="use-case-card">
              <h3>Executive Reporting</h3>
              <p>
                Auto-generate board packs, performance summaries, and
                strategic reviews &mdash; AI-assisted, human-reviewed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo — Personal Assistant */}
      <section className="live-demo" id="demo">
        <div className="section-container">
          <div className="section-header">
            <h2>See it in action</h2>
            <p>
              Our AI Personal Assistant is a live example of what Agenlytics can
              build. Speak or type in English or Chinese &mdash; the AI listens,
              categorises, and responds instantly.
            </p>
          </div>
          <div className="demo-card">
            <div className="demo-preview">
              <div className="demo-mock">
                <div className="demo-mock-header">
                  <span className="demo-dot red" />
                  <span className="demo-dot yellow" />
                  <span className="demo-dot green" />
                  <span className="demo-mock-title">Personal Assistant</span>
                </div>
                <div className="demo-mock-body">
                  <div className="demo-mock-input">
                    <span className="demo-mic-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </span>
                    &ldquo;I need to plan next quarter&apos;s budget review...&rdquo;
                  </div>
                  <div className="demo-mock-result">
                    <span className="category-badge work_task">work task</span>
                    <span className="demo-mock-feedback">Budget Review Planning</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="demo-info">
              <h3>AI Personal Assistant</h3>
              <ul className="demo-features">
                <li>Voice input with OpenAI Whisper &mdash; auto-detects English &amp; Chinese</li>
                <li>AI categorisation into Feature Requests, Bug Reports, Work Tasks, and more</li>
                <li>Instant feedback and suggestions powered by Claude</li>
                <li>Persistent history stored in Cloudflare D1</li>
                <li>Zero backend servers &mdash; runs entirely on Cloudflare Workers</li>
              </ul>
              <a href="/assistant" className="btn-primary">
                Try it live &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="testimonial">
        <div className="section-container">
          <div className="testimonial-card">
            <blockquote>
              &ldquo;Agenlytics has transformed how we make decisions.
              What used to take days of manual spreadsheet work now
              happens automatically &mdash; and the insights are better than anything
              we produced before.&rdquo;
            </blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">CO</div>
              <div>
                <strong>Chief Operating Officer</strong>
                <span>Mid-Market Enterprise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="contact">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to see Agenlytics in action?</h2>
            <p>
              Book a personalised demo and discover how AI-powered analytics can
              transform your organisation&apos;s decision-making.
            </p>
            <div className="hero-actions">
              <a href="mailto:hello@agenlytics.ai" className="btn-primary">
                Get in Touch
              </a>
              <a href="/assistant" className="btn-secondary">
                Try the Assistant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="nav-logo">
                <span className="logo-icon">A</span>
                <span className="logo-text">Agenlytics</span>
              </a>
              <p>AI-powered analytics for smarter organisations.</p>
              <p className="footer-location">Melbourne, Australia</p>
            </div>
            <div className="footer-links">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#use-cases">Use Cases</a>
              <a href="/assistant">Personal Assistant</a>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <a href="#contact">Contact</a>
              <a href="mailto:hello@agenlytics.ai">hello@agenlytics.ai</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Agenlytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
