import crypto from 'node:crypto'
import { getDatabase } from './db.js'

export async function createPrompt({ content, title = '', model = '', tags = '', favorite = 0 }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const safeTitle = typeof title === 'string' ? title.trim() : ''
  await db.run(
    'INSERT INTO prompts (id, title, content, model, tags, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, safeTitle, content, model, tags, favorite, now, now]
  )
  return getPromptById(id)
}

export async function getPromptById(id) {
  const db = getDatabase()
  return db.get('SELECT * FROM prompts WHERE id = ?', [id])
}

export async function getAllPrompts() {
  const db = getDatabase()
  return db.all('SELECT * FROM prompts ORDER BY favorite DESC, created_at DESC')
}

export async function getPromptsPaginated({ limit = 100, offset = 0, search = '', favoritesOnly = false, caseSensitive = false, tagsOnly = false, sortOrder = 'newest' } = {}) {
  const db = getDatabase()
  const conditions = []
  const params = []

  const trimmedSearch = typeof search === 'string' ? search.trim() : ''
  if (trimmedSearch) {
    const op = caseSensitive ? 'GLOB' : 'LIKE'
    const q = caseSensitive ? `*${trimmedSearch}*` : `%${trimmedSearch}%`
    if (tagsOnly) {
      conditions.push(`tags ${op} ?`)
      params.push(q)
    } else {
      conditions.push(`(title ${op} ? OR content ${op} ? OR tags ${op} ?)`)
      params.push(q, q, q)
    }
  }

  if (favoritesOnly) {
    conditions.push('favorite = 1')
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(limit) || 100)))
  const safeOffset = Math.max(0, Math.floor(Number(offset) || 0))

  let orderClause = 'ORDER BY favorite DESC, created_at DESC'
  if (sortOrder === 'oldest') orderClause = 'ORDER BY favorite DESC, created_at ASC'
  else if (sortOrder === 'alpha') orderClause = 'ORDER BY favorite DESC, title ASC'
  else if (sortOrder === 'custom') orderClause = 'ORDER BY favorite DESC, sort_order ASC, created_at DESC'

  const countRow = await db.get(
    `SELECT COUNT(*) AS count FROM prompts ${whereClause}`,
    params
  )

  const prompts = await db.all(
    `SELECT * FROM prompts ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
    [...params, safeLimit, safeOffset]
  )

  return { prompts, total: countRow?.count ?? 0 }
}

export async function toggleFavorite(id) {
  const db = getDatabase()
  const prompt = await db.get('SELECT favorite FROM prompts WHERE id = ?', [id])
  if (!prompt) return null
  const newVal = prompt.favorite ? 0 : 1
  await db.run('UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?', [newVal, new Date().toISOString(), id])
  return db.get('SELECT * FROM prompts WHERE id = ?', [id])
}

export async function updatePrompt(id, { content, title, model, tags }) {
  const db = getDatabase()
  const sets = []
  const values = []
  if (content !== undefined) { sets.push('content = ?'); values.push(content) }
  if (title !== undefined) {
    const safeTitle = typeof title === 'string' ? title.trim() : ''
    sets.push('title = ?')
    values.push(safeTitle)
  }
  if (model !== undefined) { sets.push('model = ?'); values.push(model) }
  if (tags !== undefined) { sets.push('tags = ?'); values.push(tags) }
  if (sets.length === 0) return getPromptById(id)
  sets.push('updated_at = ?')
  values.push(new Date().toISOString())
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
    'SELECT * FROM prompts WHERE title LIKE ? OR content LIKE ? OR model LIKE ? OR tags LIKE ? ORDER BY created_at DESC',
    [q, q, q, q]
  )
}

export async function updatePromptOrder(updates) {
  const db = getDatabase()
  const stmt = await db.prepare('UPDATE prompts SET sort_order = ?, updated_at = ? WHERE id = ?')
  const now = new Date().toISOString()
  try {
    for (const { id, sort_order } of updates) {
      await stmt.run(sort_order, now, id)
    }
  } finally {
    await stmt.finalize()
  }
  return { success: true }
}
