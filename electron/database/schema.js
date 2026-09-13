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
  url TEXT NOT NULL DEFAULT '',
  favorite INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vault_attachments (
  id TEXT PRIMARY KEY,
  vault_item_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0,
  data BLOB NOT NULL,
  is_encrypted INTEGER DEFAULT 1,
  created_at TEXT,
  FOREIGN KEY (vault_item_id) REFERENCES vault_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT DEFAULT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prompt_folders (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vault_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT DEFAULT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (parent_id) REFERENCES vault_folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vault_item_folders (
  id TEXT PRIMARY KEY,
  vault_item_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (vault_item_id) REFERENCES vault_items(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES vault_folders(id) ON DELETE CASCADE
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
  `ALTER TABLE vault_items ADD COLUMN color_bg TEXT DEFAULT ''`,
  `ALTER TABLE vault_items ADD COLUMN color_text TEXT DEFAULT ''`,
  `ALTER TABLE vault_items ADD COLUMN url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE folders ADD COLUMN icon TEXT DEFAULT 'folder'`,
  `ALTER TABLE folders ADD COLUMN color TEXT DEFAULT ''`,
  `ALTER TABLE folders ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`,
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
