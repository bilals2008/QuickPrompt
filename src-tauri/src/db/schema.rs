// Ported verbatim from electron/database/schema.js — table, column and index
// names must stay byte-identical so existing user databases open unchanged.
use rusqlite::Connection;

pub const SCHEMA: &str = "
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
  meta TEXT NOT NULL DEFAULT '',
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
";

// Older databases predate these columns. Running the ALTERs is idempotent by
// way of the error being swallowed, exactly like the Electron version.
const MIGRATIONS: [&str; 16] = [
    "ALTER TABLE prompts ADD COLUMN favorite INTEGER DEFAULT 0",
    "ALTER TABLE prompts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE prompts ADD COLUMN title TEXT DEFAULT ''",
    "ALTER TABLE prompts ADD COLUMN sort_order INTEGER DEFAULT 0",
    "ALTER TABLE vault_items ADD COLUMN tags TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE vault_items ADD COLUMN pinned INTEGER DEFAULT 0",
    "ALTER TABLE vault_items ADD COLUMN sort_order INTEGER DEFAULT 0",
    "ALTER TABLE vault_items ADD COLUMN color_bg TEXT DEFAULT ''",
    "ALTER TABLE vault_items ADD COLUMN color_text TEXT DEFAULT ''",
    "ALTER TABLE vault_items ADD COLUMN url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE vault_items ADD COLUMN meta TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE folders ADD COLUMN icon TEXT DEFAULT 'folder'",
    "ALTER TABLE folders ADD COLUMN color TEXT DEFAULT ''",
    "ALTER TABLE folders ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE folders ADD COLUMN appearance TEXT DEFAULT ''",
    "ALTER TABLE vault_folders ADD COLUMN appearance TEXT DEFAULT ''",
];

/// Tables the schema owns, in creation order. Used by tests and diagnostics.
pub const TABLES: [&str; 8] = [
    "prompts",
    "tags",
    "vault_items",
    "vault_attachments",
    "folders",
    "prompt_folders",
    "vault_folders",
    "vault_item_folders",
];

pub fn create_tables(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(SCHEMA)?;
    for sql in MIGRATIONS {
        // Column already exists — ignore, same as the JS migration loop.
        let _ = conn.execute_batch(sql);
    }
    Ok(())
}
