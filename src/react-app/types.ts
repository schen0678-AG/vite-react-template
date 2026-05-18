export interface Entry {
  id: number;
  text: string;
  language: string;
  category: EntryCategory;
  title: string;
  feedback: string;
  created_at: string;
}

export type EntryCategory =
  | "feature_request"
  | "bug_report"
  | "personal_planning"
  | "work_task"
  | "idea_note";

export const CATEGORIES: Record<
  EntryCategory,
  { en: string; zh: string; color: string; bg: string }
> = {
  feature_request: {
    en: "Feature Request",
    zh: "\u529F\u80FD\u9700\u6C42",
    color: "#6366f1",
    bg: "#eef2ff",
  },
  bug_report: {
    en: "Bug Report",
    zh: "\u95EE\u9898\u62A5\u544A",
    color: "#ef4444",
    bg: "#fef2f2",
  },
  personal_planning: {
    en: "Personal Planning",
    zh: "\u4E2A\u4EBA\u89C4\u5212",
    color: "#10b981",
    bg: "#ecfdf5",
  },
  work_task: {
    en: "Work Task",
    zh: "\u5DE5\u4F5C\u4EFB\u52A1",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  idea_note: {
    en: "Idea / Note",
    zh: "\u60F3\u6CD5/\u7B14\u8BB0",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
};

export const ALL_CATEGORIES = Object.keys(CATEGORIES) as EntryCategory[];

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
