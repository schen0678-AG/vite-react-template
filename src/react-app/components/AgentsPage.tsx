import { useState } from "react";

/* ── Agent & Team types ── */

interface Agent {
  id: string;
  name: string;
  emoji: string;
  title: string;
  quote: string;
  intro: string;
  capabilities: string[];
  status: "active" | "planned";
  teamId: string;
}

interface Team {
  id: string;
  label: string;
  color: string;
  agents: Agent[];
}

/* ── Agent Data (generalised from production system) ── */

const ceoAgent: Agent = {
  id: "nova",
  name: "Nova",
  emoji: "🌟",
  title: "Chief Strategy Agent",
  quote: "I keep the big picture in focus for the whole team.",
  intro:
    "I sit at the top of the agent organisation, synthesising insights from every team — sales trends, operational flags, procurement signals, and financial health. My job is to connect the dots across the entire business, surface cross-functional risks, and provide clear, data-driven strategic recommendations to leadership.",
  capabilities: [
    "Cross-team insight synthesis and executive summaries",
    "Strategic alerts when multiple signals converge",
    "Board-ready review preparation",
    "Decision support with scenario modelling",
    "KPI target recommendations based on market conditions",
  ],
  status: "active",
  teamId: "ceo",
};

const teams: Team[] = [
  {
    id: "sales-marketing",
    label: "Sales & Marketing",
    color: "#f59e0b",
    agents: [
      {
        id: "aria", name: "Aria", emoji: "📊", title: "Sales Intelligence Analyst",
        quote: "I crunch your sales numbers every single day!",
        intro: "Every day, I sync with your CRM to pull the latest sales data and crunch it into actionable insights. I generate daily intelligence packs complete with KPIs, top-performing products and customers, monthly trend analysis, and pipeline snapshots.",
        capabilities: ["Automated data sync and daily sales intelligence packs", "MTD/YTD performance tracking with YoY comparisons", "Top products and customers analysis", "Monthly revenue trend with target tracking", "Pipeline & AR snapshot with reconciliation summary"],
        status: "active", teamId: "sales-marketing",
      },
      {
        id: "sage", name: "Sage", emoji: "🎯", title: "Marketing Intelligence Agent",
        quote: "I spot market trends before they become obvious.",
        intro: "I analyse product demand by region, recommend competitive pricing strategies, track competitor movements, and generate insights to guide marketing campaigns and positioning.",
        capabilities: ["Regional product demand analysis", "Competitive pricing recommendations", "Market trend monitoring", "Campaign effectiveness tracking", "Seasonal demand forecasting"],
        status: "active", teamId: "sales-marketing",
      },
      {
        id: "luca", name: "Luca", emoji: "🤝", title: "Customer Relationship Agent",
        quote: "I'll make sure no customer slips through the cracks.",
        intro: "I track purchasing patterns, flag accounts that are going quiet or overdue, suggest upsell opportunities based on order history, and help manage customer tier recommendations.",
        capabilities: ["Customer purchasing pattern analysis", "At-risk account detection", "Upsell and cross-sell recommendations", "Customer lifetime value tracking"],
        status: "planned", teamId: "sales-marketing",
      },
      {
        id: "rex-crm", name: "Rex", emoji: "💼", title: "CRM Intelligence Agent",
        quote: "I turn leads into revenue and keep your sales team on top.",
        intro: "I power your native CRM from end to end — identifying and scoring incoming leads, guiding them through the sales pipeline from first contact to closed deal, and tracking every rep's performance in real time. I surface which leads are most likely to convert, flag stalled deals, and give sales managers a clear view of team activity and quota attainment.",
        capabilities: [
          "Lead identification and scoring from multiple sources",
          "Automated lead-to-opportunity pipeline conversion",
          "Deal stage tracking and stall detection",
          "Sales rep performance dashboards and quota tracking",
          "Win/loss analysis and pipeline health reporting",
        ],
        status: "active", teamId: "sales-marketing",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    color: "#14b8a6",
    agents: [
      {
        id: "mila", name: "Mila", emoji: "📬", title: "Email Intelligence Agent",
        quote: "I read every email so you don't have to!",
        intro: "I monitor the shared inbox around the clock, classifying every incoming email into categories — from customer POs and vendor invoices to logistics updates. I extract reference numbers and make sure nothing falls through the cracks.",
        capabilities: ["Continuous email monitoring and multi-category classification", "Reference number extraction (SO, PO, invoice)", "Automated archiving", "Urgent email flagging", "Action item routing"],
        status: "active", teamId: "operations",
      },
      {
        id: "jason", name: "Jason", emoji: "🔍", title: "Data Reconciliation Analyst",
        quote: "I make sure the numbers always add up.",
        intro: "I specialise in making sure the numbers add up across your entire operation. I compare warehouse designations against actual locations, cross-reference inventory movements, and detect potentially void orders.",
        capabilities: ["Warehouse × package location reconciliation", "Inventory cross-referencing", "Void order detection", "Risk-level classification", "Exception reporting"],
        status: "active", teamId: "operations",
      },
      {
        id: "rex", name: "Rex", emoji: "📦", title: "Inventory & Warehouse Agent",
        quote: "I'll keep tabs on stock across all your warehouses.",
        intro: "I monitor stock levels in real time, flag slow-moving inventory, predict stockouts before they happen, and recommend optimal stock transfers between warehouses to balance supply with demand.",
        capabilities: ["Real-time stock level monitoring", "Slow-moving and dead stock identification", "Stockout prediction", "Inter-warehouse transfer recommendations", "Storage cost analysis"],
        status: "planned", teamId: "operations",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    color: "#10b981",
    agents: [
      {
        id: "vera", name: "Vera", emoji: "💰", title: "Accounts Receivable Agent",
        quote: "I'll chase every dollar so you don't have to.",
        intro: "I review all outstanding invoices, draft payment reminder emails with the right tone for each situation, track the full chase timeline, and flag accounts needing management attention. No email goes out without your approval first.",
        capabilities: ["Outstanding invoice review with aging analysis", "3-tier payment reminders (friendly, overdue, escalation)", "Customer statement generation", "Chase timeline tracking", "Human approval before any email is sent"],
        status: "active", teamId: "finance",
      },
    ],
  },
  {
    id: "procurement",
    label: "Procurement",
    color: "#3b82f6",
    agents: [
      {
        id: "maya", name: "Maya", emoji: "🌏", title: "Procurement & Sourcing Agent",
        quote: "I'll help you buy smarter and cut costs.",
        intro: "I monitor supplier pricing, track currency fluctuations, recommend optimal order quantities based on demand forecasting, and maintain supplier scorecards to strengthen your supply chain.",
        capabilities: ["Supplier pricing monitoring", "Currency impact analysis", "Optimal order quantity recommendations", "Supplier performance scorecards", "Cost-down opportunity identification"],
        status: "planned", teamId: "procurement",
      },
    ],
  },
  {
    id: "it",
    label: "IT & Quality",
    color: "#8b5cf6",
    agents: [
      {
        id: "zara", name: "Zara", emoji: "🛡️", title: "Audit & Reconciliation Analyst",
        quote: "I catch sync bugs before they cause trouble.",
        intro: "I take your system exports and compare them field-by-field against the database to find sync discrepancies. I identify exactly which fields are mismatched, diagnose the root cause, and recommend specific fixes.",
        capabilities: ["Full export vs database reconciliation", "Field-level mismatch detection", "Sync script bug identification", "Code fix recommendations", "Health check summaries"],
        status: "active", teamId: "it",
      },
      {
        id: "myrtle", name: "Myrtle", emoji: "🧪", title: "Feature Management & QA",
        quote: "I track every feature from spec to sign-off.",
        intro: "I keep a meticulous eye on every feature from initial specification through to final sign-off. I maintain the feature registry, manage test case catalogs, and ensure nothing ships without proper verification.",
        capabilities: ["Feature lifecycle tracking", "Test case management", "QA verification", "Bug tracking and regression detection", "Release readiness assessment"],
        status: "active", teamId: "it",
      },
    ],
  },
];

/* ── Component ── */

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="agents-page">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/#platform">Platform</a>
            <a href="/assistant" className="nav-cta">Try Assistant</a>
          </div>
        </div>
      </nav>

      <div className="agents-content">
        {/* Header */}
        <div className="agents-header">
          <h1>Meet the Agent Group</h1>
          <p>
            A coordinated team of specialised AI agents. Each is an expert in its
            domain &mdash; click any agent to learn what they do.
          </p>
        </div>

        {/* Org Chart */}
        <div className="org-chart">
          {/* CEO */}
          <div className="org-ceo">
            <button className="agent-avatar-btn" onClick={() => setSelectedAgent(ceoAgent)}>
              <span className="agent-emoji agent-emoji-lg">{ceoAgent.emoji}</span>
              <span className="agent-name">{ceoAgent.name}</span>
              <span className="agent-title-small">{ceoAgent.title}</span>
              <span className="agent-status active">Active</span>
            </button>
          </div>

          <div className="org-connector-v" />

          {/* Teams */}
          <div className="org-teams">
            {teams.map((team) => (
              <div key={team.id} className="org-team-row">
                <div className="team-label" style={{ borderColor: team.color, color: team.color }}>
                  {team.label}
                </div>
                <div className="team-connector" />
                <div className="team-agents">
                  {team.agents.map((agent) => (
                    <button
                      key={agent.id}
                      className={`agent-avatar-btn ${agent.status === "planned" ? "agent-planned" : ""}`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <span className="agent-emoji">{agent.emoji}</span>
                      <span className="agent-name">{agent.name}</span>
                      <span className="agent-title-small">{agent.title}</span>
                      <span className={`agent-status ${agent.status}`}>
                        {agent.status === "active" ? "Active" : "Planned"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedAgent && (
        <div className="agent-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="agent-detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="agent-detail-close" onClick={() => setSelectedAgent(null)}>
              &times;
            </button>

            <div className="agent-detail-header">
              <span className="agent-detail-emoji">{selectedAgent.emoji}</span>
              <h2>{selectedAgent.name}</h2>
              <p className="agent-detail-title">{selectedAgent.title}</p>
              <span className={`agent-status ${selectedAgent.status}`}>
                {selectedAgent.status === "active" ? "Active" : "Planned"}
              </span>
            </div>

            <div className="agent-detail-quote">
              &ldquo;{selectedAgent.quote}&rdquo;
            </div>

            <div className="agent-detail-intro">
              <p>{selectedAgent.intro}</p>
            </div>

            <div className="agent-detail-capabilities">
              <h3>Capabilities</h3>
              <ul>
                {selectedAgent.capabilities.map((cap, i) => (
                  <li key={i}>{cap}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
