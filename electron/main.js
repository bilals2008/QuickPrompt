import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { initDatabase, closeDatabase } from "./database/db.js"
import {
  createPrompt,
  getAllPrompts,
  updatePrompt,
  deletePrompt,
  getAllTags,
  createTag,
  searchPrompts,
  toggleFavorite,
} from "./database/prompts.js"
import updater from "electron-updater"
const { autoUpdater } = updater

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, "../dist")
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, "../public")

let mainWindow
let tray
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]
const isMac = process.platform === "darwin"

const settingsPath = path.join(app.getPath("userData"), "QuickPrompt", "settings.json")

function readSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
    }
  } catch { /* ignore */ }
  return {}
}

function writeSettings(data) {
  const dir = path.dirname(settingsPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2))
}

function getSetting(key, fallback) {
  const settings = readSettings()
  return settings[key] ?? fallback
}

function setSetting(key, value) {
  const settings = readSettings()
  settings[key] = value
  writeSettings(settings)
}
let updateStatus = "idle"
let updateInfo = null

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on("checking-for-update", () => {
  updateStatus = "checking"
  mainWindow?.webContents.send("update:event", { status: "checking" })
})

autoUpdater.on("update-available", (info) => {
  updateStatus = "available"
  updateInfo = { version: info.version, releaseNotes: info.releaseNotes }
  mainWindow?.webContents.send("update:event", { status: "available", ...updateInfo })
})

autoUpdater.on("download-progress", (progress) => {
  updateStatus = "downloading"
  mainWindow?.webContents.send("update:event", { status: "downloading", percent: progress.percent })
})

autoUpdater.on("update-not-available", () => {
  updateStatus = "idle"
  mainWindow?.webContents.send("update:event", { status: "idle" })
})

autoUpdater.on("update-downloaded", (info) => {
  updateStatus = "downloaded"
  updateInfo = { version: info.version, releaseNotes: info.releaseNotes }
  mainWindow?.webContents.send("update:event", { status: "downloaded", ...updateInfo })
})

autoUpdater.on("error", (err) => {
  updateStatus = "error"
  mainWindow?.webContents.send("update:event", { status: "error", error: err.message })
})

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC, "icon.png")
  const icon = nativeImage.createFromPath(iconPath)
  const trayIcon = isMac ? icon.resize({ width: 16, height: 16 }) : icon.resize({ width: 24, height: 24 })

  tray = new Tray(trayIcon)
  tray.setToolTip("QuickPrompt")

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open QuickPrompt",
      click: toggleWindow,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        closeDatabase()
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on("click", toggleWindow)
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 600,
    minWidth: 360,
    minHeight: 400,
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    skipTaskbar: true,
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, "index.html"))
  }
}

let dbReady = false
let dbError = null

app.whenReady().then(async () => {
  if (isMac) {
    app.dock.hide()
  }

  try {
    await initDatabase()
    dbReady = true
    console.log("[Main] Database ready")
  } catch (err) {
    dbError = err.message || String(err)
    console.error("[Main] Database init failed:", err)
  }

  createWindow()
  createTray()

  if (getSetting("autoCheckUpdates", true)) {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        autoUpdater.checkForUpdates().catch(() => {})
      }
    }, 3000)
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (!isMac) app.quit()
})

app.on("before-quit", () => {
  app.isQuitting = true
  closeDatabase()
})

app.on("will-quit", () => {
  if (tray) tray.destroy()
})

ipcMain.handle("get-app-version", () => {
  return app.getVersion()
})

ipcMain.handle("db:health", () => {
  return { ready: dbReady, error: dbError }
})

ipcMain.handle("db:createPrompt", async (_event, data) => {
  return createPrompt(data)
})

ipcMain.handle("db:getAllPrompts", async () => {
  return getAllPrompts()
})

ipcMain.handle("db:updatePrompt", async (_event, id, data) => {
  return updatePrompt(id, data)
})

ipcMain.handle("db:deletePrompt", async (_event, id) => {
  return deletePrompt(id)
})

ipcMain.handle("db:getAllTags", async () => {
  return getAllTags()
})

ipcMain.handle("db:createTag", async (_event, name) => {
  return createTag(name)
})

ipcMain.handle("db:searchPrompts", async (_event, query) => {
  return searchPrompts(query)
})

ipcMain.handle("db:toggleFavorite", async (_event, id) => {
  return toggleFavorite(id)
})

ipcMain.handle("update:check", async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, updateInfo: result?.updateInfo }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle("update:install", () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle("update:download", async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle("update:get-status", () => {
  return { status: updateStatus, ...updateInfo }
})

ipcMain.handle("update:set-auto-check", (_event, enabled) => {
  setSetting("autoCheckUpdates", enabled)
})

ipcMain.handle("update:get-auto-check", () => {
  return getSetting("autoCheckUpdates", true)
})

ipcMain.handle("settings:get", (_event, key, fallback) => {
  return getSetting(key, fallback)
})

ipcMain.handle("settings:set", (_event, key, value) => {
  setSetting(key, value)
})
