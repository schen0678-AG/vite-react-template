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
