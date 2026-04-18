CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en-US',
  category TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
