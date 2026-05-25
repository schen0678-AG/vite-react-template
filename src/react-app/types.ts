/* \u2500\u2500 Personal Assistant: projects, features, todos \u2500\u2500 */

export interface AssistantFeature {
  id: number;
  project_id: number;
  summary: string;
  details: string[];
  updated_at: string;
}

export interface AssistantProject {
  id: number;
  name: string;
  description: string;
  language: string;
  features: AssistantFeature[];
  created_at: string;
  updated_at: string;
}

export type TodoStatus = "pending" | "done" | "cancelled";

export interface AssistantTodo {
  id: number;
  due_at: string | null;
  action: string;
  target: string;
  notes: string;
  status: TodoStatus;
  project_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssistantState {
  projects: AssistantProject[];
  todos: AssistantTodo[];
}

export type AssistantOp =
  | { kind: "project_created"; id: number; name: string }
  | { kind: "project_updated"; id: number; name: string }
  | { kind: "project_deleted"; id: number; name: string }
  | { kind: "feature_created"; id: number; project_id: number; summary: string; project_name: string }
  | { kind: "feature_updated"; id: number; project_id: number; summary: string }
  | { kind: "feature_deleted"; id: number; summary: string }
  | { kind: "todo_created"; id: number; action: string; due_at: string | null }
  | { kind: "todo_updated"; id: number; action: string }
  | { kind: "todo_completed"; id: number; action: string }
  | { kind: "todo_deleted"; id: number; action: string };

export interface AssistantTurnResult {
  ops: AssistantOp[];
  reply: string;
  state: AssistantState;
}

/* ── CRM: Leads ── */

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Not Qualified"
  | "Converted";

export interface Lead {
  id: number;
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  product_interest: string;
  estimated_value: number | null;
  status: LeadStatus;
  summary: string;
  raw_transcript: string;
  language: string;
  salesperson: string;
  created_at: string;
}

export const SALESPEOPLE = ["Alex", "Jordan", "Sam"] as const;
export type Salesperson = typeof SALESPEOPLE[number];

export const SALESPERSON_COLORS: Record<Salesperson, string> = {
  Alex:   "#f97316",
  Jordan: "#3b82f6",
  Sam:    "#10b981",
};

export const LEAD_STATUSES: { key: LeadStatus; color: string; bg: string }[] = [
  { key: "New",           color: "#6366f1", bg: "#eef2ff" },
  { key: "Contacted",     color: "#0ea5e9", bg: "#e0f2fe" },
  { key: "Qualified",     color: "#10b981", bg: "#ecfdf5" },
  { key: "Not Qualified", color: "#94a3b8", bg: "#f1f5f9" },
  { key: "Converted",     color: "#f59e0b", bg: "#fffbeb" },
];

/* ── CRM: Contacts ── */

export interface Contact {
  id: number;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  wechat: string;
  address: string;
  notes: string;
  source: "manual" | "voice" | "card_scan";
  language: string;
  created_at: string;
}

/** Parsed contact returned by the card scan endpoint (no id yet). */
export type ParsedContact = Omit<Contact, "id" | "source" | "language" | "created_at">;

/* ── CRM: Deals ── */

export type DealStage =
  | "New Opportunity"
  | "Needs Confirmed"
  | "Solution Discussed"
  | "Quote Prepared"
  | "Quote Sent"
  | "Negotiation"
  | "Won"
  | "Lost";

export interface Deal {
  id: number;
  name: string;
  lead_id: number | null;
  company: string;
  contact_name: string;
  stage: DealStage;
  probability: number;
  deal_value: number | null;
  expected_close_date: string | null;
  notes: string;
  language: string;
  salesperson: string;
  commission_rate: number;
  created_at: string;
}

export interface DashboardSummary {
  leads: number;
  contacts: number;
  pipeline: number;
  accounts: number;
}

export interface LeadsByDay {
  date: string;
  byPerson: Record<string, number>;
}

export interface ConversionStats {
  windowDays: number;
  windowLeads: number;
  windowConverted: number;
  windowRate: number;
  allTimeLeads: number;
  allTimeConverted: number;
  allTimeRate: number;
}

export interface SalesByPerson {
  salesperson: string;
  wonCount: number;
  wonValue: number;
  pipelineValue: number;
  weightedValue: number;
  commission: number;
}

export const DEAL_STAGES: { key: DealStage; color: string; bg: string }[] = [
  { key: "New Opportunity",   color: "#6366f1", bg: "#eef2ff" },
  { key: "Needs Confirmed",   color: "#0ea5e9", bg: "#e0f2fe" },
  { key: "Solution Discussed", color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "Quote Prepared",    color: "#06b6d4", bg: "#ecfeff" },
  { key: "Quote Sent",        color: "#f59e0b", bg: "#fffbeb" },
  { key: "Negotiation",       color: "#ef4444", bg: "#fef2f2" },
  { key: "Won",               color: "#10b981", bg: "#ecfdf5" },
  { key: "Lost",              color: "#94a3b8", bg: "#f1f5f9" },
];

export const PROBABILITY_OPTIONS = [25, 50, 80, 95, 100] as const;
