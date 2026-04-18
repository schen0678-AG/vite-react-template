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
