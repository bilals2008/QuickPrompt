// File: electron/database/schema.js
import { getDatabase } from './db.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  model TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vault_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'note',
  value TEXT NOT NULL DEFAULT '',
  is_encrypted INTEGER DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  favorite INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT ''
);
`

const MIGRATIONS = [
  `ALTER TABLE prompts ADD COLUMN favorite INTEGER DEFAULT 0`,
  `ALTER TABLE prompts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE prompts ADD COLUMN title TEXT DEFAULT ''`,
  `ALTER TABLE prompts ADD COLUMN sort_order INTEGER DEFAULT 0`,
  `ALTER TABLE vault_items ADD COLUMN tags TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE vault_items ADD COLUMN pinned INTEGER DEFAULT 0`,
  `ALTER TABLE vault_items ADD COLUMN sort_order INTEGER DEFAULT 0`,
]

export async function createTables() {
  const db = getDatabase()
  await db.exec(SCHEMA)
  for (const sql of MIGRATIONS) {
    try {
      await db.exec(sql)
    } catch {
      // Column already exists, ignore
    }
  }
}
