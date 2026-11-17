// File: electron/database/vault.js
import crypto from 'node:crypto'
import { safeStorage } from 'electron'
import { getDatabase } from './db.js'

export function isEncryptionAvailable() {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

function encryptValue(plain) {
  const str = String(plain ?? '')
  if (!isEncryptionAvailable()) {
    return { value: Buffer.from(str, 'utf-8').toString('base64'), encrypted: false }
  }
  const buf = safeStorage.encryptString(str)
  return { value: buf.toString('base64'), encrypted: true }
}

function decryptValue(encoded, wasEncrypted) {
  const str = String(encoded ?? '')
  if (!str) return ''
  if (!wasEncrypted) {
    return Buffer.from(str, 'base64').toString('utf-8')
  }
  try {
    return safeStorage.decryptString(Buffer.from(str, 'base64'))
  } catch {
    return ''
  }
}

function parseMeta(raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function serializeMeta(meta) {
  if (meta === undefined) return undefined
  if (meta === null) return ''
  if (typeof meta === 'string') {
    const parsed = parseMeta(meta)
    return Object.keys(parsed).length > 0 ? JSON.stringify(parsed) : ''
  }
  if (typeof meta === 'object') {
    const clean = {}
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || value === null || value === '') continue
      clean[key] = String(value)
    }
    return Object.keys(clean).length > 0 ? JSON.stringify(clean) : ''
  }
  return ''
}

export function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    notes: row.notes,
    meta: parseMeta(row.meta),
    tags: row.tags ? String(row.tags).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
    url: row.url || '',
    favorite: Boolean(row.favorite),
    pinned: Boolean(row.pinned),
    sort_order: row.sort_order,
    color_bg: row.color_bg || '',
    color_text: row.color_text || '',
    hasValue: Boolean(row.value && row.value.length > 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function createVaultItem({ title = '', type = 'note', value = '', notes = '', meta = '', tags = '', url = '', color_bg = '', color_text = '' } = {}) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const safeTitle = typeof title === 'string' ? title.trim() : ''
  const safeType = typeof type === 'string' && type ? type : 'note'
  const safeNotes = typeof notes === 'string' ? notes : ''
  const safeUrl = typeof url === 'string' ? url.trim() : ''
  const safeColorBg = typeof color_bg === 'string' ? color_bg : ''
  const safeColorText = typeof color_text === 'string' ? color_text : ''
  const safeMeta = serializeMeta(meta) ?? ''
  const tagList = typeof tags === 'string'
    ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    : (Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [])
  const safeTags = tagList.join(',')
  const { value: encoded, encrypted } = encryptValue(value)
  await db.run(
    `INSERT INTO vault_items (id, title, type, value, is_encrypted, notes, meta, tags, url, favorite, pinned, sort_order, color_bg, color_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)`,
    [id, safeTitle, safeType, encoded, encrypted ? 1 : 0, safeNotes, safeMeta, safeTags, safeUrl, safeColorBg, safeColorText, now, now]
  )
  return getVaultItem(id)
}

export async function getVaultItem(id) {
  const db = getDatabase()
  const row = await db.get('SELECT * FROM vault_items WHERE id = ?', [id])
  return mapRow(row)
}

function sanitizeTags(tags) {
  if (typeof tags === 'string') {
    return tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  }
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
  }
  return []
}

export async function getAllVaultItems({ sortOrder = 'newest', type = '', search = '', tags = '' } = {}) {
  const db = getDatabase()
  const conditions = []
  const params = []

  if (type) {
    conditions.push('type = ?')
    params.push(type)
  }

  const trimmedSearch = typeof search === 'string' ? search.trim() : ''
  if (trimmedSearch) {
    conditions.push('(title LIKE ? OR notes LIKE ? OR tags LIKE ?)')
    const q = `%${trimmedSearch}%`
    params.push(q, q, q)
  }

  const tagList = sanitizeTags(tags)
  if (tagList.length > 0) {
    conditions.push('(' + tagList.map(() => 'tags LIKE ?').join(' OR ') + ')')
    for (const t of tagList) params.push(`%${t}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  let orderClause = 'ORDER BY pinned DESC, favorite DESC, created_at DESC'
  if (sortOrder === 'oldest') orderClause = 'ORDER BY pinned DESC, favorite DESC, created_at ASC'
  else if (sortOrder === 'alpha') orderClause = 'ORDER BY pinned DESC, favorite DESC, title COLLATE NOCASE ASC'
  else if (sortOrder === 'custom') orderClause = 'ORDER BY pinned DESC, favorite DESC, sort_order ASC, created_at DESC'

  const rows = await db.all(`SELECT * FROM vault_items ${whereClause} ${orderClause}`, params)
  return rows.map(mapRow)
}

export async function revealVaultValue(id) {
  const db = getDatabase()
  const row = await db.get('SELECT * FROM vault_items WHERE id = ?', [id])
  if (!row) return null
  return {
    ...mapRow(row),
    value: decryptValue(row.value, row.is_encrypted === 1),
  }
}

export async function updateVaultItem(id, { title, type, value, notes, meta, tags, url, color_bg, color_text } = {}) {
  const db = getDatabase()
  const sets = []
  const params = []
  if (title !== undefined) {
    sets.push('title = ?')
    params.push(typeof title === 'string' ? title.trim() : '')
  }
  if (type !== undefined) {
    sets.push('type = ?')
    params.push(typeof type === 'string' && type ? type : 'note')
  }
  if (notes !== undefined) {
    sets.push('notes = ?')
    params.push(typeof notes === 'string' ? notes : '')
  }
  if (meta !== undefined) {
    sets.push('meta = ?')
    params.push(serializeMeta(meta) ?? '')
  }
  if (tags !== undefined) {
    sets.push('tags = ?')
    params.push(sanitizeTags(tags).join(','))
  }
  if (url !== undefined) {
    sets.push('url = ?')
    params.push(typeof url === 'string' ? url.trim() : '')
  }
  if (color_bg !== undefined) {
    sets.push('color_bg = ?')
    params.push(typeof color_bg === 'string' ? color_bg : '')
  }
  if (color_text !== undefined) {
    sets.push('color_text = ?')
    params.push(typeof color_text === 'string' ? color_text : '')
  }
  if (value !== undefined) {
    const { value: encoded, encrypted } = encryptValue(value)
    sets.push('value = ?')
    params.push(encoded)
    sets.push('is_encrypted = ?')
    params.push(encrypted ? 1 : 0)
  }
  if (sets.length === 0) return getVaultItem(id)
  sets.push('updated_at = ?')
  params.push(new Date().toISOString())
  params.push(id)
  await db.run(`UPDATE vault_items SET ${sets.join(', ')} WHERE id = ?`, params)
  return getVaultItem(id)
}

export async function toggleVaultFavorite(id) {
  const db = getDatabase()
  const row = await db.get('SELECT favorite FROM vault_items WHERE id = ?', [id])
  if (!row) return null
  const newVal = row.favorite ? 0 : 1
  await db.run('UPDATE vault_items SET favorite = ?, updated_at = ? WHERE id = ?', [newVal, new Date().toISOString(), id])
  return getVaultItem(id)
}

export async function toggleVaultPin(id) {
  const db = getDatabase()
  const row = await db.get('SELECT pinned FROM vault_items WHERE id = ?', [id])
  if (!row) return null
  const newVal = row.pinned ? 0 : 1
  await db.run('UPDATE vault_items SET pinned = ?, updated_at = ? WHERE id = ?', [newVal, new Date().toISOString(), id])
  return getVaultItem(id)
}

export async function updateVaultOrder(updates) {
  const db = getDatabase()
  const now = new Date().toISOString()
  for (const { id, sort_order } of updates) {
    await db.run('UPDATE vault_items SET sort_order = ?, updated_at = ? WHERE id = ?', [sort_order, now, id])
  }
  return { success: true }
}

export async function deleteVaultItem(id) {
  const db = getDatabase()
  await db.run('DELETE FROM vault_attachments WHERE vault_item_id = ?', [id])
  await db.run('DELETE FROM vault_items WHERE id = ?', [id])
  return { success: true }
}

export async function getAttachment(id) {
  const db = getDatabase()
  const row = await db.get('SELECT * FROM vault_attachments WHERE id = ?', [id])
  if (!row) return null
  return {
    id: row.id,
    vault_item_id: row.vault_item_id,
    filename: row.filename,
    mime_type: row.mime_type,
    size: row.size,
    created_at: row.created_at,
  }
}

export async function getAttachmentData(id) {
  const db = getDatabase()
  const row = await db.get('SELECT * FROM vault_attachments WHERE id = ?', [id])
  if (!row) return null
  const decoded = row.is_encrypted ? decryptValue(row.data.toString('base64'), true) : row.data.toString('utf8')
  return {
    id: row.id,
    vault_item_id: row.vault_item_id,
    filename: row.filename,
    mime_type: row.mime_type,
    size: row.size,
    data: decoded,
    created_at: row.created_at,
  }
}

export async function listAttachments(vaultItemId) {
  const db = getDatabase()
  const rows = await db.all('SELECT * FROM vault_attachments WHERE vault_item_id = ? ORDER BY created_at ASC', [vaultItemId])
  return rows.map((r) => ({
    id: r.id,
    vault_item_id: r.vault_item_id,
    filename: r.filename,
    mime_type: r.mime_type,
    size: r.size,
    created_at: r.created_at,
  }))
}

export async function createAttachment({ vaultItemId, filename, mimeType, data }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const safeVaultItemId = typeof vaultItemId === 'string' ? vaultItemId.trim() : ''
  const safeFilename = typeof filename === 'string' ? filename.trim() : 'file'
  const safeMimeType = typeof mimeType === 'string' ? mimeType : ''
  const rawBuf = Buffer.isBuffer(data) ? data : Buffer.from(String(data ?? ''), 'utf8')
  const { value: encoded, encrypted } = encryptValue(rawBuf.toString('utf8'))
  const encBuf = Buffer.from(encoded, 'utf8')
  await db.run(
    `INSERT INTO vault_attachments (id, vault_item_id, filename, mime_type, size, data, is_encrypted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, safeVaultItemId, safeFilename, safeMimeType, rawBuf.length, encBuf, encrypted ? 1 : 0, now]
  )
  return getAttachment(id)
}

export async function deleteAttachment(id) {
  const db = getDatabase()
  const row = await db.get('SELECT id FROM vault_attachments WHERE id = ?', [id])
  if (!row) return false
  await db.run('DELETE FROM vault_attachments WHERE id = ?', [id])
  return true
}