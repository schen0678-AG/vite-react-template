-- Personal Assistant: per-user workspace of projects, features, and todos.
-- Replaces the old single-tenant `entries` table.

DROP TABLE IF EXISTS entries;
DROP INDEX IF EXISTS idx_entries_category;
DROP INDEX IF EXISTS idx_entries_created_at;

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                                   -- Google `sub` from the verified ID token
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en-US',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '[]',                      -- JSON array of bullet strings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_features_user_project ON features(user_id, project_id);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  due_at TEXT,                                             -- ISO 8601 datetime, or NULL for undated
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',                  -- 'pending' | 'done' | 'cancelled'
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_todos_user_due ON todos(user_id, status, due_at);

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
  salesperson TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_salesperson ON leads(salesperson);

-- CRM: Contacts (manual entry, voice, or business card scan)
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  wechat TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',   -- 'manual' | 'voice' | 'card_scan'
  language TEXT NOT NULL DEFAULT 'en-US',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);

-- CRM: Deals (created from leads via convert flow)
CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  lead_id INTEGER,
  company TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'New Opportunity',
  probability INTEGER NOT NULL DEFAULT 25,
  deal_value REAL,
  expected_close_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en-US',
  salesperson TEXT NOT NULL DEFAULT '',
  commission_rate REAL NOT NULL DEFAULT 0.05,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_salesperson ON deals(salesperson);
