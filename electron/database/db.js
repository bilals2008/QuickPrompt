// File: electron/database/db.js
import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { createTables } from './schema.js'

let db = null
let rawDb = null

function wrap(db) {
  return {
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err)
          else resolve(this)
        })
      })
    },
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
    },
    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    },
    exec(sql) {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    },
  }
}

export function getDatabase() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

async function configurePragmas(database) {
  // WAL = crash-safe: pending writes live in a sidecar file (quickprompt.db-wal)
  // and are replayed on next open if the process was killed mid-write.
  await database.run('PRAGMA journal_mode = WAL')

  // FULL forces fsync on every commit. In WAL mode this still allows concurrent
  // readers, but it guarantees that a committed transaction is durable across
  // a sudden power loss instead of sitting only in the OS write buffer.
  await database.run('PRAGMA synchronous = FULL')

  // On macOS, fullfsync forces an extra barrier so the on-disk cache is flushed.
  // No-op on Windows/Linux but cheap to set.
  await database.run('PRAGMA fullfsync = ON')

  // If another writer briefly holds the lock (e.g. an antivirus scan or a stale
  // handle), wait up to 5s instead of failing immediately with SQLITE_BUSY.
  await database.run('PRAGMA busy_timeout = 5000')

  // Cap the WAL file so it does not grow unbounded between checkpoints.
  await database.run('PRAGMA journal_size_limit = 67108864')

  // Foreign keys are off by default in SQLite; keep the existing behavior.
  await database.run('PRAGMA foreign_keys = ON')
}

async function verifyIntegrity(database) {
  try {
    const row = await database.get('PRAGMA integrity_check(1)')
    const result = row && typeof row.integrity_check === 'string' ? row.integrity_check : ''
    if (result === 'ok') return { ok: true }
    return { ok: false, reason: result || 'integrity_check returned no result' }
  } catch (err) {
    return { ok: false, reason: err?.message || String(err) }
  }
}

async function tryRecover(database) {
  // Best-effort recovery: force a WAL checkpoint (TRUNCATE) and re-check.
  // If the main DB file is corrupt SQLite will surface that error here.
  try {
    await database.run('PRAGMA wal_checkpoint(TRUNCATE)')
  } catch {
    /* ignore */
  }
  return verifyIntegrity(database)
}

export async function initDatabase() {
  if (db) return db

  const dbDir = path.join(app.getPath('userData'), 'QuickPrompt')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'quickprompt.db')

  const raw = await new Promise((resolve, reject) => {
    const d = new sqlite3.Database(dbPath, (err) => {
      if (err) { reject(err); return }
      resolve(d)
    })
  })

  rawDb = raw
  db = wrap(raw)

  // Apply durability settings BEFORE running any DDL/DML.
  await configurePragmas(db)

  // Detect a corrupt database left behind by a previous crash or power loss.
  const initialCheck = await verifyIntegrity(db)
  if (!initialCheck.ok) {
    console.warn('[DB] Integrity check failed on open:', initialCheck.reason)
    const recovered = await tryRecover(db)
    if (!recovered.ok) {
      rawDb = null
      db = null
      try { raw.close() } catch { /* ignore */ }
      throw new Error(`Database is corrupt and could not be auto-recovered: ${recovered.reason}`)
    }
    console.log('[DB] Database recovered via WAL checkpoint')
  }

  await createTables()

  console.log('[DB] Database initialized')
  return db
}

export async function closeDatabase() {
  if (!db) return
  const localRaw = rawDb
  const localDb = db
  db = null
  rawDb = null
  try {
    // Checkpoint the WAL into the main DB so the next open starts clean
    // and we are not leaving a -wal file with pending frames behind.
    await localDb.run('PRAGMA wal_checkpoint(TRUNCATE)')
  } catch (err) {
    console.warn('[DB] WAL checkpoint on close failed:', err?.message || err)
  }
  try {
    await localDb.run('PRAGMA optimize')
  } catch { /* ignore */ }
  try {
    await new Promise((resolve) => localRaw.close(() => resolve()))
  } catch (err) {
    console.warn('[DB] Underlying sqlite3 close failed:', err?.message || err)
  }
}
