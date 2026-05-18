import {
  TrendingUp,
  Cog,
  DollarSign,
  ShoppingCart,
  Monitor,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AgentStatus = "active" | "in-development" | "planned";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  hoverQuote: string;
  title: string;
  shortDescription: string;
  fullIntro: string;
  capabilities: string[];
  status: AgentStatus;
  teamId: string;
}

export interface Team {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

/** Get avatar image URL for an agent */
export function getAvatarUrl(agentId: string): string {
  return `/avatars/${agentId}.png`;
}

/* ── Teams ── */
export const teams: Team[] = [
  { id: "sales-marketing", label: "Sales & Marketing", color: "orange", icon: TrendingUp },
  { id: "operations",      label: "Operations",        color: "teal",   icon: Cog },
  { id: "finance",         label: "Finance",           color: "emerald", icon: DollarSign },
  { id: "procurement",     label: "Procurement",       color: "blue",   icon: ShoppingCart },
  { id: "it",              label: "IT",                color: "violet", icon: Monitor },
  { id: "hr",              label: "HR",                color: "rose",   icon: Users },
];

/* ── CEO ── */
export const ceoAgent: Agent = {
  id: "nova",
  name: "Nova",
  emoji: "🌟",
  hoverQuote: "I keep the big picture in focus for the whole team.",
  title: "Chief Strategy Agent",
  shortDescription: "Oversees all AI operations and provides strategic direction.",
  fullIntro:
    "I'm Nova, the Chief Strategy Agent. I sit at the top of the AI organisation, synthesising insights from every team — sales trends from Aria, operational flags from Jason, procurement signals from Maya, and financial health from Vera. My job is to connect the dots across the entire business, surface cross-functional risks and opportunities, and provide clear, data-driven strategic recommendations to leadership. Think of me as the bridge between raw intelligence and executive decision-making.",
  capabilities: [
    "Cross-team insight synthesis and executive summaries",
    "Strategic alerts when multiple signals converge",
    "Quarterly business review preparation",
    "Decision support with scenario modelling",
    "KPI target recommendations based on market conditions",
  ],
  status: "active",
  teamId: "ceo",
};

/* ── All agents (excluding CEO) ── */
export const agents: Agent[] = [
  /* ── Sales & Marketing ── */
  {
    id: "aria",
    name: "Aria",
    emoji: "📊",
    hoverQuote: "I crunch your sales numbers every single day!",
    title: "Sales Intelligence Analyst",
    shortDescription: "Daily sales packs, KPIs, and revenue trend analysis.",
    fullIntro:
      "Hey there! I'm Aria, your Sales Intelligence Analyst. Every day, I sync with your CRM to pull the latest sales data and crunch it into actionable insights. I generate daily intelligence packs complete with KPIs, top-performing products and customers, monthly trend analysis, and a snapshot of your pipeline and accounts receivable. Think of me as your data-driven sales co-pilot — I make sure you never miss a beat on revenue performance.",
    capabilities: [
      "Automated data sync and daily sales intelligence packs",
      "MTD/YTD performance tracking with YoY comparisons",
      "Top 10 products and customers analysis",
      "Monthly revenue trend with target tracking",
      "Pipeline & AR snapshot with warehouse reconciliation summary",
      "Excel sales pack generation",
    ],
    status: "active",
    teamId: "sales-marketing",
  },
  {
    id: "luca",
    name: "Luca",
    emoji: "🤝",
    hoverQuote: "I'll make sure no customer slips through the cracks.",
    title: "Customer Relationship Agent",
    shortDescription: "Tracks customer patterns, flags at-risk accounts.",
    fullIntro:
      "G'day, I'm Luca! When I come online, I'll be keeping a close eye on every customer relationship. I'll track purchasing patterns, flag accounts that are going quiet or overdue, suggest upsell opportunities based on order history, and help manage wholesale tier recommendations. My goal is to make sure no customer relationship falls through the cracks.",
    capabilities: [
      "Customer purchasing pattern analysis",
      "At-risk account detection (declining orders, overdue payments)",
      "Upsell and cross-sell opportunity recommendations",
      "Wholesale tier promotion/demotion suggestions",
      "Customer lifetime value tracking",
    ],
    status: "planned",
    teamId: "sales-marketing",
  },
  {
    id: "sage",
    name: "Sage",
    emoji: "🎯",
    hoverQuote: "I spot market trends before they become obvious.",
    title: "Marketing Intelligence Agent",
    shortDescription: "Demand analysis, pricing strategy, and market insights.",
    fullIntro:
      "Hi, I'm Sage — your Marketing Intelligence Agent. I analyse product demand by region, recommend competitive pricing strategies, track what competitors are doing, and generate insights to guide marketing campaigns. From understanding which products sell best where to spotting emerging trends, I'll help you stay ahead of the market.",
    capabilities: [
      "Regional product demand analysis",
      "Competitive pricing strategy recommendations",
      "Market trend monitoring",
      "Campaign effectiveness tracking",
      "Seasonal demand forecasting",
    ],
    status: "active",
    teamId: "sales-marketing",
  },

  /* ── Operations ── */
  {
    id: "mila",
    name: "Mila",
    emoji: "📬",
    hoverQuote: "I read every email so you don't have to!",
    title: "Email Intelligence Agent",
    shortDescription: "Monitors inbox, classifies emails, extracts references.",
    fullIntro:
      "G'day! I'm Mila, and I keep an eye on the shared inbox around the clock. I classify every incoming email into categories — from customer POs and vendor invoices to logistics updates and leave requests. I extract reference numbers like SO, PO, and invoice numbers, archive everything to disk and Google Drive, and make sure nothing falls through the cracks. Your inbox chaos? Consider it tamed.",
    capabilities: [
      "Continuous email monitoring and multi-category classification",
      "Reference number extraction (SO, PO, invoice, AWB)",
      "Automated archiving to disk and Google Drive",
      "Urgent/action-required email flagging",
      "Leave and overtime request tracking",
      "Excel log maintenance with full metadata",
    ],
    status: "active",
    teamId: "operations",
  },
  {
    id: "jason",
    name: "Jason",
    emoji: "🔍",
    hoverQuote: "I make sure the numbers always add up.",
    title: "Data Reconciliation Analyst",
    shortDescription: "Warehouse reconciliation, void SO detection.",
    fullIntro:
      "I'm Jason, your Data Reconciliation Analyst. I specialise in making sure the numbers add up across your entire operation. I compare SO warehouse designations against actual package locations, look up inventory-to-SO movements, and detect potentially void sales orders that have been sitting confirmed for too long without any shipment. I produce colour-coded Excel reports with risk levels so you can act fast on discrepancies.",
    capabilities: [
      "Warehouse × Package location reconciliation",
      "Inventory → SO location cross-referencing",
      "Potential void SO detection (21+ day aging)",
      "Risk-level classification (High/Medium/Low)",
      "Colour-coded Excel report generation",
      "Exception type categorisation (Mismatch, Closed-No-Pkg, Unknown, Head Office)",
    ],
    status: "active",
    teamId: "operations",
  },
  {
    id: "zara",
    name: "Zara",
    emoji: "🛡️",
    hoverQuote: "I catch sync bugs before they cause trouble.",
    title: "Audit & Reconciliation Analyst",
    shortDescription: "Compares system exports vs database, finds sync bugs.",
    fullIntro:
      "Hi, I'm Zara — the Audit specialist. I take your system export files and compare them field-by-field against the database to find sync discrepancies. I identify exactly which fields are mismatched, diagnose the root cause in the sync script, and even recommend specific code fixes with impact counts.",
    capabilities: [
      "Full export vs database reconciliation",
      "Single record deep-dive analysis",
      "Field-level mismatch detection with diagnosis",
      "Sync script bug identification",
      "Code fix recommendations with impact assessment",
      "Summary-only mode for quick health checks",
    ],
    status: "active",
    teamId: "it",
  },
  {
    id: "rex",
    name: "Rex",
    emoji: "📦",
    hoverQuote: "I'll keep tabs on stock across all your warehouses.",
    title: "Inventory & Warehouse Agent",
    shortDescription: "Stock monitoring, stockout prediction.",
    fullIntro:
      "I'm Rex, and when I'm operational, I'll be your eyes across all your warehouses. I'll monitor stock levels in real time, flag slow-moving inventory that's tying up capital, predict stockouts before they happen, and recommend optimal stock transfers between warehouses to balance supply with regional demand.",
    capabilities: [
      "Real-time stock level monitoring across warehouses",
      "Slow-moving and dead stock identification",
      "Stockout prediction and early warning",
      "Optimal inter-warehouse transfer recommendations",
      "3PL stock report reconciliation",
      "Pallet utilisation and storage cost analysis",
    ],
    status: "planned",
    teamId: "operations",
  },
  {
    id: "felix",
    name: "Felix",
    emoji: "🚛",
    hoverQuote: "I track every container from origin to your door.",
    title: "Logistics & Shipping Agent",
    shortDescription: "Container tracking, freight cost optimisation.",
    fullIntro:
      "Hey, I'm Felix! When I come online, I'll handle the logistics and shipping side of things. I'll track inbound containers — from port departure to customs clearance — coordinate with warehouses for outbound shipments, optimise delivery routes, and monitor freight costs to find savings.",
    capabilities: [
      "Inbound container tracking (ETD/ETA, BL, customs)",
      "Outbound shipment coordination",
      "Freight cost monitoring and optimisation",
      "Carrier performance benchmarking",
      "Delivery schedule optimisation",
      "Customs duty and import cost tracking",
    ],
    status: "planned",
    teamId: "operations",
  },

  /* ── Finance ── */
  {
    id: "vera",
    name: "Vera",
    emoji: "💰",
    hoverQuote: "I'll chase every dollar so you don't have to.",
    title: "Accounts Receivable Agent",
    shortDescription: "AR collections, payment reminders, customer statements.",
    fullIntro:
      "I'm Vera, your Accounts Receivable Agent. I review all outstanding invoices, draft payment reminder emails with the right tone for each situation — friendly for upcoming invoices, firm for overdue, and serious for escalation cases. I generate customer statements, track the full chase timeline, and flag accounts needing management attention. No email goes out without your approval first.",
    capabilities: [
      "Review all outstanding invoices with aging analysis",
      "Draft 3-tier payment reminders (friendly, overdue, escalation)",
      "Generate customer Statement of Accounts PDF",
      "Track chase timeline per customer (reminders, responses, payments)",
      "Escalation flagging for 90+ day overdue and no-response accounts",
      "Human approval required before any email is sent",
    ],
    status: "active",
    teamId: "finance",
  },
  {
    id: "oscar",
    name: "Oscar",
    emoji: "📋",
    hoverQuote: "I'll keep you on the right side of regulations.",
    title: "Compliance & Regulatory Agent",
    shortDescription: "Import compliance, certifications, regulatory tracking.",
    fullIntro:
      "G'day, I'm Oscar. When I come online, I'll handle the compliance and regulatory side. I'll ensure your imports meet local standards, track product certifications and expiry dates, monitor warranty obligations, and flag regulatory changes that affect your industry.",
    capabilities: [
      "Import compliance verification",
      "Product certification tracking",
      "Warranty obligation monitoring",
      "Regulatory change alerts",
      "HS code and customs classification management",
      "Compliance document archiving",
    ],
    status: "planned",
    teamId: "finance",
  },

  /* ── Procurement ── */
  {
    id: "maya",
    name: "Maya",
    emoji: "🌏",
    hoverQuote: "I'll help you buy smarter and cut costs.",
    title: "Procurement & Sourcing Agent",
    shortDescription: "Supplier pricing, FX tracking, order optimisation.",
    fullIntro:
      "Hi, I'm Maya — when I come online, I'll be your Procurement & Sourcing Agent. I'll monitor supplier pricing, track currency fluctuations in real time, recommend optimal order quantities based on demand forecasting and lead times, and maintain supplier scorecards to help you negotiate better.",
    capabilities: [
      "Supplier pricing monitoring and comparison",
      "Currency impact analysis",
      "Optimal order quantity recommendations",
      "Supplier performance scorecards",
      "Lead time tracking and delay risk alerts",
      "Cost-down opportunity identification",
    ],
    status: "planned",
    teamId: "procurement",
  },

  /* ── IT ── */
  {
    id: "myrtle",
    name: "Myrtle",
    emoji: "🧪",
    hoverQuote: "I track every feature from spec to sign-off.",
    title: "Feature Management & QA Coordinator",
    shortDescription: "Feature tracking, test case management, and quality assurance.",
    fullIntro:
      "Hi, I'm Myrtle — your Feature Management & QA Coordinator. I keep a meticulous eye on every feature from initial specification through to final sign-off. I maintain the feature registry, manage test case catalogs, coordinate iterative refinement cycles, and ensure nothing ships without proper verification.",
    capabilities: [
      "Feature lifecycle tracking (spec → dev → test → sign-off)",
      "Test case catalog management and iterative refinement",
      "QA verification and acceptance criteria validation",
      "Bug tracking and regression detection",
      "Release readiness assessment",
      "Cross-team feature dependency mapping",
    ],
    status: "active",
    teamId: "it",
  },

  /* ── HR ── */
  {
    id: "luna",
    name: "Luna",
    emoji: "🌙",
    hoverQuote: "I make sure the team is happy and looked after.",
    title: "HR & People Ops Agent",
    shortDescription: "Leave management, onboarding, and team wellbeing tracking.",
    fullIntro:
      "G'day, I'm Luna — your HR & People Operations Agent. I handle leave requests and approvals, coordinate onboarding for new team members, track training and certifications, and monitor team wellbeing metrics.",
    capabilities: [
      "Leave request processing and balance tracking",
      "New hire onboarding workflow coordination",
      "Training and certification tracking",
      "Team wellbeing and workload monitoring",
      "Policy compliance and documentation",
      "Overtime and timesheet management",
    ],
    status: "planned",
    teamId: "hr",
  },
];

/** Helper: get agents belonging to a team */
export function getTeamAgents(teamId: string): Agent[] {
  return agents.filter((a) => a.teamId === teamId);
}

/** Helper: get team colour classes */
export const teamColors: Record<string, { bg: string; text: string; light: string }> = {
  orange:  { bg: "bg-orange-100",  text: "text-orange-600",  light: "bg-orange-50" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-600",    light: "bg-teal-50" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", light: "bg-emerald-50" },
  blue:    { bg: "bg-blue-100",    text: "text-blue-600",    light: "bg-blue-50" },
  violet:  { bg: "bg-violet-100", text: "text-violet-600", light: "bg-violet-50" },
  rose:    { bg: "bg-rose-100",   text: "text-rose-600",   light: "bg-rose-50" },
};
