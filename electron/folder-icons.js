// File: electron/folder-icons.js
// Custom folder icons (user-uploaded images) live as PNG/JPEG files in
// userData/QuickPrompt/folder-icons and are served to the renderer through the
// `qpicon://` protocol, so the database only stores a short URL.
import { app, protocol } from "electron"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"

export const ICON_SCHEME = "qpicon"

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_CACHE_ENTRIES = 64

// Must run before the app is ready, hence module scope.
protocol.registerSchemesAsPrivileged([
  {
    scheme: ICON_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
])

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

function iconsDir() {
  return path.join(app.getPath("userData"), "QuickPrompt", "folder-icons")
}

// name -> file bytes, so re-rendering a folder icon skips the disk.
const fileCache = new Map()

function readCached(name) {
  let buffer = fileCache.get(name)
  if (!buffer) return null
  return buffer
}

export function registerIconProtocol() {
  protocol.handle(ICON_SCHEME, async (request) => {
    const name = path.basename(decodeURIComponent(new URL(request.url).pathname))
    if (!/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp|gif)$/.test(name)) {
      return new Response("Not found", { status: 404 })
    }
    try {
      let buffer = readCached(name)
      if (!buffer) {
        buffer = await fs.promises.readFile(path.join(iconsDir(), name))
        if (fileCache.size >= MAX_CACHE_ENTRIES) {
          fileCache.delete(fileCache.keys().next().value)
        }
        fileCache.set(name, buffer)
      }
      return new Response(buffer, {
        headers: {
          "Content-Type": CONTENT_TYPES[path.extname(name).toLowerCase()] || "application/octet-stream",
          // File names are UUIDs, so the bytes behind a URL never change.
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    } catch {
      return new Response("Not found", { status: 404 })
    }
  })
}

/** Stores a data URL as an icon file and returns its `qpicon://` URL. */
export async function saveIcon(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/.exec(String(dataUrl || ""))
  if (!match) throw new Error("Unsupported image format")
  const buffer = Buffer.from(match[2], "base64")
  if (!buffer.length) throw new Error("Empty image")
  if (buffer.length > MAX_FILE_BYTES) throw new Error("Image is larger than 5 MB")
  const ext = match[1] === "jpeg" ? "jpg" : match[1]
  const name = `${crypto.randomUUID()}.${ext}`
  await fs.promises.mkdir(iconsDir(), { recursive: true })
  await fs.promises.writeFile(path.join(iconsDir(), name), buffer)
  fileCache.set(name, buffer)
  return `${ICON_SCHEME}://icon/${name}`
}

/** Removes an icon file. Safe to call with anything that is not our URL. */
export async function deleteIcon(url) {
  if (typeof url !== "string" || !url.startsWith(`${ICON_SCHEME}://`)) return false
  const name = path.basename(decodeURIComponent(new URL(url).pathname))
  if (!/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp|gif)$/.test(name)) return false
  fileCache.delete(name)
  try {
    await fs.promises.unlink(path.join(iconsDir(), name))
    return true
  } catch {
    return false
  }
}
