import crypto from 'node:crypto'
import { getDatabase } from './db.js'

export async function createPrompt({ content, model = '', tags = '' }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.run(
    'INSERT INTO prompts (id, content, model, tags, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, content, model, tags, now]
  )
  return getPromptById(id)
}

export async function getPromptById(id) {
  const db = getDatabase()
  return db.get('SELECT * FROM prompts WHERE id = ?', [id])
}

export async function getAllPrompts() {
  const db = getDatabase()
  return db.all('SELECT * FROM prompts ORDER BY created_at DESC')
}

export async function updatePrompt(id, { content, model, tags }) {
  const db = getDatabase()
  const sets = []
  const values = []
  if (content !== undefined) { sets.push('content = ?'); values.push(content) }
  if (model !== undefined) { sets.push('model = ?'); values.push(model) }
  if (tags !== undefined) { sets.push('tags = ?'); values.push(tags) }
  if (sets.length === 0) return getPromptById(id)
  values.push(id)
  await db.run(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`, values)
  return getPromptById(id)
}

export async function deletePrompt(id) {
  const db = getDatabase()
  await db.run('DELETE FROM prompts WHERE id = ?', [id])
  return { success: true }
}

export async function getAllTags() {
  const db = getDatabase()
  return db.all('SELECT * FROM tags ORDER BY name ASC')
}

export async function createTag(name) {
  const db = getDatabase()
  const trimmed = name.trim().toLowerCase()
  const existing = await db.get('SELECT * FROM tags WHERE name = ?', [trimmed])
  if (existing) return existing
  const id = crypto.randomUUID()
  await db.run('INSERT INTO tags (id, name) VALUES (?, ?)', [id, trimmed])
  return { id, name: trimmed }
}

export async function searchPrompts(query) {
  const db = getDatabase()
  const q = `%${query}%`
  return db.all(
    'SELECT * FROM prompts WHERE content LIKE ? OR model LIKE ? OR tags LIKE ? ORDER BY created_at DESC',
    [q, q, q]
  )
}
