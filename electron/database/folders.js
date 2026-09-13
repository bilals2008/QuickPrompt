import crypto from 'node:crypto'
import { getDatabase } from './db.js'

export async function createFolder({ name, parentId = null, icon = 'folder', color = '' }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const maxOrder = await db.get('SELECT MAX(sort_order) AS max_order FROM folders WHERE parent_id IS ?', [parentId])
  const sortOrder = (maxOrder?.max_order ?? -1) + 1
  await db.run(
    'INSERT INTO folders (id, name, parent_id, icon, color, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name.trim(), parentId, icon, color, sortOrder, now, now]
  )
  return getFolderById(id)
}

export async function getFolderById(id) {
  const db = getDatabase()
  return db.get('SELECT * FROM folders WHERE id = ?', [id])
}

export async function getAllFolders() {
  const db = getDatabase()
  return db.all('SELECT * FROM folders ORDER BY sort_order ASC, name ASC')
}

export async function getRootFolders() {
  const db = getDatabase()
  return db.all('SELECT * FROM folders WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC')
}

export async function getChildFolders(parentId) {
  const db = getDatabase()
  return db.all('SELECT * FROM folders WHERE parent_id = ? ORDER BY sort_order ASC, name ASC', [parentId])
}

export async function renameFolder(id, name) {
  const db = getDatabase()
  await db.run('UPDATE folders SET name = ?, updated_at = ? WHERE id = ?', [name.trim(), new Date().toISOString(), id])
  return getFolderById(id)
}

export async function updateFolder(id, { name, icon, color }) {
  const db = getDatabase()
  const sets = []
  const values = []
  if (name !== undefined) { sets.push('name = ?'); values.push(name.trim()) }
  if (icon !== undefined) { sets.push('icon = ?'); values.push(icon) }
  if (color !== undefined) { sets.push('color = ?'); values.push(color) }
  if (sets.length === 0) return getFolderById(id)
  sets.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  await db.run(`UPDATE folders SET ${sets.join(', ')} WHERE id = ?`, values)
  return getFolderById(id)
}

export async function deleteFolder(id) {
  const db = getDatabase()
  await db.run('DELETE FROM prompt_folders WHERE folder_id = ?', [id])
  await db.run('DELETE FROM folders WHERE id = ?', [id])
  return { success: true }
}

export async function getFolderBreadcrumb(folderId) {
  const db = getDatabase()
  const chain = []
  let current = await db.get('SELECT * FROM folders WHERE id = ?', [folderId])
  while (current) {
    chain.unshift(current)
    if (!current.parent_id) break
    current = await db.get('SELECT * FROM folders WHERE id = ?', [current.parent_id])
  }
  return chain
}

export async function addPromptToFolder(promptId, folderId) {
  const db = getDatabase()
  const existing = await db.get(
    'SELECT id FROM prompt_folders WHERE prompt_id = ? AND folder_id = ?',
    [promptId, folderId]
  )
  if (existing) return existing
  const id = crypto.randomUUID()
  const maxOrder = await db.get('SELECT MAX(sort_order) AS max_order FROM prompt_folders WHERE folder_id = ?', [folderId])
  const sortOrder = (maxOrder?.max_order ?? -1) + 1
  await db.run(
    'INSERT INTO prompt_folders (id, prompt_id, folder_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, promptId, folderId, sortOrder, new Date().toISOString()]
  )
  return { id, promptId, folderId }
}

export async function removePromptFromFolder(promptId, folderId) {
  const db = getDatabase()
  await db.run('DELETE FROM prompt_folders WHERE prompt_id = ? AND folder_id = ?', [promptId, folderId])
  return { success: true }
}

export async function movePromptBetweenFolders(promptId, fromFolderId, toFolderId) {
  const db = getDatabase()
  await db.run('DELETE FROM prompt_folders WHERE prompt_id = ? AND folder_id = ?', [promptId, fromFolderId])
  const maxOrder = await db.get('SELECT MAX(sort_order) AS max_order FROM prompt_folders WHERE folder_id = ?', [toFolderId])
  const sortOrder = (maxOrder?.max_order ?? -1) + 1
  const id = crypto.randomUUID()
  await db.run(
    'INSERT INTO prompt_folders (id, prompt_id, folder_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, promptId, toFolderId, sortOrder, new Date().toISOString()]
  )
  return { success: true }
}

export async function getPromptsInFolder(folderId, { limit = 200, offset = 0 } = {}) {
  const db = getDatabase()
  const countRow = await db.get(
    'SELECT COUNT(*) AS count FROM prompt_folders WHERE folder_id = ?',
    [folderId]
  )
  const rows = await db.all(
    `SELECT p.* FROM prompts p
     INNER JOIN prompt_folders pf ON p.id = pf.prompt_id
     WHERE pf.folder_id = ?
     ORDER BY pf.sort_order ASC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    [folderId, limit, offset]
  )
  return { prompts: rows, total: countRow?.count ?? 0 }
}

export async function getPromptFolders(promptId) {
  const db = getDatabase()
  return db.all(
    `SELECT f.* FROM folders f
     INNER JOIN prompt_folders pf ON f.id = pf.folder_id
     WHERE pf.prompt_id = ?
     ORDER BY f.name ASC`,
    [promptId]
  )
}

export async function searchFolders(query) {
  const db = getDatabase()
  const q = `%${query}%`
  return db.all('SELECT * FROM folders WHERE name LIKE ? ORDER BY name ASC', [q])
}
