import { getDatabase } from './db.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  model TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
`

export async function createTables() {
  const db = getDatabase()
  await db.exec(SCHEMA)
}
