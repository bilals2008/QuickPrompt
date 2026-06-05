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
`

const MIGRATIONS = [
  `ALTER TABLE prompts ADD COLUMN favorite INTEGER DEFAULT 0`,
  `ALTER TABLE prompts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE prompts ADD COLUMN title TEXT DEFAULT ''`,
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
