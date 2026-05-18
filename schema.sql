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

-- CRM: minimal lead capture (voice/text → Claude → leads)
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  product_interest TEXT NOT NULL DEFAULT '',
  estimated_value REAL,
  status TEXT NOT NULL DEFAULT 'New',
  summary TEXT NOT NULL DEFAULT '',
  raw_transcript TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en-US',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
