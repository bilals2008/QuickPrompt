import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { createTables } from './schema.js'

let db = null

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

  db = wrap(raw)

  await db.run('PRAGMA journal_mode = WAL')
  await db.run('PRAGMA foreign_keys = ON')
  await createTables()

  console.log('[DB] Database initialized')
  return db
}

export function closeDatabase() {
  if (db) {
    db.run('PRAGMA optimize')
  }
  db = null
}
