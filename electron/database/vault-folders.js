import crypto from 'node:crypto'
import { getDatabase } from './db.js'
import { mapRow } from './vault.js'

export async function createVaultFolder({ name, parentId = null, icon = 'folder', color = '' }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const maxOrder = await db.get('SELECT MAX(sort_order) AS max_order FROM vault_folders WHERE parent_id IS ?', [parentId])
  const sortOrder = (maxOrder?.max_order ?? -1) + 1
  await db.run(
    'INSERT INTO vault_folders (id, name, parent_id, icon, color, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name.trim(), parentId, icon, color, sortOrder, now, now]
  )
  return getVaultFolderById(id)
}

export async function getVaultFolderById(id) {
  const db = getDatabase()
  return db.get('SELECT * FROM vault_folders WHERE id = ?', [id])
}

export async function getAllVaultFolders() {
  const db = getDatabase()
  return db.all('SELECT * FROM vault_folders ORDER BY sort_order ASC, name ASC')
}

export async function getRootVaultFolders() {
  const db = getDatabase()
  return db.all('SELECT * FROM vault_folders WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC')
}

export async function getChildVaultFolders(parentId) {
  const db = getDatabase()
  return db.all('SELECT * FROM vault_folders WHERE parent_id = ? ORDER BY sort_order ASC, name ASC', [parentId])
}

export async function renameVaultFolder(id, name) {
  const db = getDatabase()
  await db.run('UPDATE vault_folders SET name = ?, updated_at = ? WHERE id = ?', [name.trim(), new Date().toISOString(), id])
  return getVaultFolderById(id)
}

export async function updateVaultFolder(id, { name, icon, color }) {
  const db = getDatabase()
  const sets = []
  const values = []
  if (name !== undefined) { sets.push('name = ?'); values.push(name.trim()) }
  if (icon !== undefined) { sets.push('icon = ?'); values.push(icon) }
  if (color !== undefined) { sets.push('color = ?'); values.push(color) }
  if (sets.length === 0) return getVaultFolderById(id)
  sets.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  await db.run(`UPDATE vault_folders SET ${sets.join(', ')} WHERE id = ?`, values)
  return getVaultFolderById(id)
}

export async function deleteVaultFolder(id) {
  const db = getDatabase()
  await db.run('DELETE FROM vault_item_folders WHERE folder_id = ?', [id])
  await db.run('DELETE FROM vault_folders WHERE id = ?', [id])
  return { success: true }
}

export async function getVaultFolderBreadcrumb(folderId) {
  const db = getDatabase()
  const chain = []
  let current = await db.get('SELECT * FROM vault_folders WHERE id = ?', [folderId])
  while (current) {
    chain.unshift(current)
    if (!current.parent_id) break
    current = await db.get('SELECT * FROM vault_folders WHERE id = ?', [current.parent_id])
  }
  return chain
}

export async function addVaultItemToFolder(vaultItemId, folderId) {
  const db = getDatabase()
  const existing = await db.get(
    'SELECT id FROM vault_item_folders WHERE vault_item_id = ? AND folder_id = ?',
    [vaultItemId, folderId]
  )
  if (existing) return existing
  const id = crypto.randomUUID()
  const maxOrder = await db.get('SELECT MAX(sort_order) AS max_order FROM vault_item_folders WHERE folder_id = ?', [folderId])
  const sortOrder = (maxOrder?.max_order ?? -1) + 1
  await db.run(
    'INSERT INTO vault_item_folders (id, vault_item_id, folder_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, vaultItemId, folderId, sortOrder, new Date().toISOString()]
  )
  return { id, vaultItemId, folderId }
}

export async function removeVaultItemFromFolder(vaultItemId, folderId) {
  const db = getDatabase()
  await db.run('DELETE FROM vault_item_folders WHERE vault_item_id = ? AND folder_id = ?', [vaultItemId, folderId])
  return { success: true }
}

export async function getVaultItemsInFolder(folderId, { limit = 200, offset = 0 } = {}) {
  const db = getDatabase()
  const countRow = await db.get(
    'SELECT COUNT(*) AS count FROM vault_item_folders WHERE folder_id = ?',
    [folderId]
  )
  const rows = await db.all(
    `SELECT v.* FROM vault_items v
     INNER JOIN vault_item_folders vf ON v.id = vf.vault_item_id
     WHERE vf.folder_id = ?
     ORDER BY vf.sort_order ASC, v.created_at DESC
     LIMIT ? OFFSET ?`,
    [folderId, limit, offset]
  )
  return { items: rows.map(mapRow), total: countRow?.count ?? 0 }
}

export async function getVaultItemFolders(vaultItemId) {
  const db = getDatabase()
  return db.all(
    `SELECT f.* FROM vault_folders f
     INNER JOIN vault_item_folders vf ON f.id = vf.folder_id
     WHERE vf.vault_item_id = ?
     ORDER BY f.name ASC`,
    [vaultItemId]
  )
}

export async function searchVaultFolders(query) {
  const db = getDatabase()
  const q = `%${query}%`
  return db.all('SELECT * FROM vault_folders WHERE name LIKE ? ORDER BY name ASC', [q])
}
