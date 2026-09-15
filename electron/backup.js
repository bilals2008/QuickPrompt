import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { app, safeStorage } from 'electron'
import { getDatabase } from './database/db.js'

const MAGIC = Buffer.from('QPBK')
const VERSION = 1
const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16
const HEADER_LEN = 4 + 4 + SALT_LEN + IV_LEN

export function encryptPassphrase(passphrase) {
  if (!safeStorage.isEncryptionAvailable()) return null
  return safeStorage.encryptString(passphrase).toString('base64')
}

export function decryptPassphrase(encryptedBase64) {
  if (!encryptedBase64) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    return safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64'))
  } catch {
    return null
  }
}

function deriveKey(passphrase, salt) {
  return crypto.scryptSync(passphrase, salt, 32, { N: 2 ** 14, r: 8, p: 1 })
}

function encryptBuffer(data, passphrase) {
  const salt = crypto.randomBytes(SALT_LEN)
  const iv = crypto.randomBytes(IV_LEN)
  const key = deriveKey(passphrase, salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()

  const header = Buffer.alloc(HEADER_LEN)
  MAGIC.copy(header, 0)
  header.writeUInt32LE(VERSION, 4)
  salt.copy(header, 8)
  iv.copy(header, 8 + SALT_LEN)
  return Buffer.concat([header, authTag, encrypted])
}

function decryptBuffer(buf, passphrase) {
  if (buf.length < HEADER_LEN + TAG_LEN + 16) {
    throw new Error('Backup file is too small or corrupted')
  }
  if (!buf.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Invalid backup file format')
  }
  const version = buf.readUInt32LE(4)
  if (version !== VERSION) {
    throw new Error(`Unsupported backup version: ${version}`)
  }

  const salt = buf.subarray(8, 8 + SALT_LEN)
  const iv = buf.subarray(8 + SALT_LEN, HEADER_LEN)
  const authTag = buf.subarray(HEADER_LEN, HEADER_LEN + TAG_LEN)
  const ciphertext = buf.subarray(HEADER_LEN + TAG_LEN)

  const key = deriveKey(passphrase, salt)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export async function createBackup({ backupDir, passphrase }) {
  const dbDir = path.join(app.getPath('userData'), 'QuickPrompt')
  const tempPath = path.join(dbDir, '__backup_temp__.db')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
  const destPath = path.join(backupDir, `quickprompt-${stamp}.qpbak`)

  const db = getDatabase()
  await db.exec(`VACUUM INTO '${tempPath.replace(/'/g, "''")}'`)

  try {
    const data = fs.readFileSync(tempPath)
    const encrypted = encryptBuffer(data, passphrase)
    fs.writeFileSync(destPath, encrypted)
    return { success: true, path: destPath }
  } finally {
    try { fs.unlinkSync(tempPath) } catch {}
  }
}

export function restoreBackup({ backupFilePath, passphrase, dbPath }) {
  const buf = fs.readFileSync(backupFilePath)
  const decrypted = decryptBuffer(buf, passphrase)

  const header = decrypted.subarray(0, 16).toString('latin1')
  if (!header.startsWith('SQLite format 3')) {
    throw new Error('Decrypted file is not a valid SQLite database')
  }

  fs.writeFileSync(dbPath, decrypted)
  return { success: true }
}

export function cleanupOldBackups(dir, maxKeep = 10) {
  if (!dir || !fs.existsSync(dir)) return
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.qpbak'))
    .map(f => ({
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)

  for (let i = maxKeep; i < files.length; i++) {
    try { fs.unlinkSync(files[i].path) } catch {}
  }
}

export function isBackupDue(schedule, lastBackupTime) {
  if (!schedule || schedule === 'off') return false
  if (!lastBackupTime) return true

  const last = new Date(lastBackupTime)
  const now = new Date()
  const diff = now - last

  switch (schedule) {
    case 'daily':
      return diff >= 24 * 60 * 60 * 1000
    case 'weekly':
      return diff >= 7 * 24 * 60 * 60 * 1000
    case 'monthly':
      return now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear()
    default:
      return false
  }
}
