import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, Notification, screen, shell, dialog } from "electron"
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
const platform = process.platform
const isMac = platform === "darwin"
const isWin = platform === "win32"
const isLinux = platform === "linux"

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

function notifyRenderer(event) {
  mainWindow?.webContents.send("update:event", event)
}

autoUpdater.on("checking-for-update", () => {
  updateStatus = "checking"
  notifyRenderer({ status: "checking" })
})

autoUpdater.on("update-available", (info) => {
  updateStatus = "available"
  updateInfo = { version: info.version, releaseNotes: info.releaseNotes }
  notifyRenderer({ status: "available", ...updateInfo })
  showNativeNotification("Update available", `QuickPrompt v${info.version} is available.`)
})

autoUpdater.on("download-progress", (progress) => {
  updateStatus = "downloading"
  notifyRenderer({ status: "downloading", percent: progress.percent })
})

autoUpdater.on("update-not-available", () => {
  updateStatus = "idle"
  notifyRenderer({ status: "idle" })
})

autoUpdater.on("update-downloaded", (info) => {
  updateStatus = "downloaded"
  updateInfo = { version: info.version, releaseNotes: info.releaseNotes }
  notifyRenderer({ status: "downloaded", ...updateInfo })
  showNativeNotification("Update ready", `v${info.version} downloaded. Restart to install.`)
})

autoUpdater.on("error", (err) => {
  updateStatus = "error"
  notifyRenderer({ status: "error", error: err.message })
})

function showNativeNotification(title, body, onClick) {
  if (!Notification.isSupported()) return
  if (getSetting("notifications", false) === false) return
  const n = new Notification({
    title,
    body,
    silent: false,
  })
  if (onClick) n.on("click", onClick)
  n.show()
}

function buildTrayMenu() {
  const alwaysOnTop = getSetting("alwaysOnTop", false)
  return Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? "Hide QuickPrompt" : "Open QuickPrompt",
      click: toggleWindow,
    },
    {
      label: "Quick Search",
      accelerator: platform === "darwin" ? "Cmd+Alt+P" : "Ctrl+Alt+P",
      click: () => {
        showAndFocus()
        mainWindow?.webContents.send("app:global-search")
      },
    },
    { type: "separator" },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: alwaysOnTop,
      click: (menuItem) => {
        const next = menuItem.checked
        setSetting("alwaysOnTop", next)
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(next)
        }
      },
    },
    { type: "separator" },
    {
      label: "Import / Export…",
      click: () => {
        showAndFocus("/import-export")
      },
    },
    {
      label: "Settings",
      click: () => {
        showAndFocus("/settings")
      },
    },
    {
      label: "Check for Updates…",
      click: async () => {
        showAndFocus("/settings")
        setTimeout(() => {
          autoUpdater.checkForUpdates().catch(() => {})
        }, 400)
      },
    },
    { type: "separator" },
    {
      label: "About QuickPrompt",
      click: () => {
        showAndFocus("/settings")
        setTimeout(() => {
          mainWindow?.webContents.send("app:navigate", "/settings?section=about")
        }, 200)
      },
    },
    { type: "separator" },
    {
      label: "Quit QuickPrompt",
      accelerator: platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
      click: () => {
        app.isQuitting = true
        closeDatabase()
        app.quit()
      },
    },
  ])
}

function refreshTrayMenu() {
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(buildTrayMenu())
  }
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC, "icon.png")
  const icon = nativeImage.createFromPath(iconPath)
  const trayIcon = isMac ? icon.resize({ width: 18, height: 18 }) : icon.resize({ width: 24, height: 24 })

  tray = new Tray(trayIcon)
  tray.setToolTip("QuickPrompt")
  tray.setContextMenu(buildTrayMenu())

  tray.on("click", () => {
    if (isMac) {
      toggleWindow()
    } else {
      positionWindowNearTray()
      toggleWindow()
    }
  })

  tray.on("right-click", () => {
    refreshTrayMenu()
  })
}

function positionWindowNearTray() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  try {
    const trayBounds = tray?.getBounds?.()
    if (!trayBounds || (trayBounds.width === 0 && trayBounds.height === 0)) return
    const winBounds = mainWindow.getBounds()
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
    const workArea = display.workArea
    const margin = 8
    const offset = 4

    let x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2)
    let y
    const trayCenterY = trayBounds.y + trayBounds.height / 2
    const isTopHalf = trayCenterY < workArea.y + workArea.height / 2
    y = isTopHalf
      ? Math.round(trayBounds.y + trayBounds.height + offset)
      : Math.round(trayBounds.y - winBounds.height - offset)

    x = Math.max(workArea.x + margin, Math.min(x, workArea.x + workArea.width - winBounds.width - margin))
    y = Math.max(workArea.y + margin, Math.min(y, workArea.y + workArea.height - winBounds.height - margin))

    mainWindow.setPosition(x, y, false)
  } catch (err) {
    console.warn("[Main] popover positioning failed:", err.message)
  }
}

function showAndFocus(route) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (!mainWindow.isVisible()) {
    positionWindowNearTray()
  }
  mainWindow.show()
  mainWindow.focus()
  if (route) {
    mainWindow.webContents.send("app:navigate", route)
  }
}

function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide()
  } else {
    showAndFocus()
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
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    skipTaskbar: true,
  })

  const alwaysOnTop = getSetting("alwaysOnTop", false)
  mainWindow.setAlwaysOnTop(alwaysOnTop)

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
    refreshTrayMenu()
  })

  mainWindow.on("show", refreshTrayMenu)
  mainWindow.on("hide", refreshTrayMenu)

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximize-changed", true)
  })
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximize-changed", false)
  })

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      const closeBehavior = getSetting("closeBehavior", "tray")
      if (closeBehavior === "quit") {
        app.isQuitting = true
        closeDatabase()
        app.quit()
      } else {
        mainWindow.hide()
      }
    }
  })

  mainWindow.on("focus", () => {
    refreshTrayMenu()
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
  registerGlobalShortcut()

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
  globalShortcut.unregisterAll()
  if (tray) tray.destroy()
})

function registerGlobalShortcut() {
  const accelerator = isMac ? "Cmd+Alt+P" : "Ctrl+Alt+P"
  const ok = globalShortcut.register(accelerator, () => {
    showAndFocus()
    mainWindow?.webContents.send("app:global-search")
  })
  if (!ok) {
    console.warn(`[Main] Failed to register global shortcut: ${accelerator}`)
  } else {
    console.log(`[Main] Global shortcut registered: ${accelerator}`)
  }
}

ipcMain.handle("get-app-version", () => {
  return app.getVersion()
})

ipcMain.handle("get-platform", () => {
  return {
    platform,
    isMac,
    isWin,
    isLinux,
    notificationsSupported: Notification.isSupported(),
  }
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

ipcMain.handle("app:hideWindow", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
  return { success: true }
})

ipcMain.handle("window:minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
})

ipcMain.handle("window:toggle-maximize", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return { success: false }
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
  return { success: true, maximized: mainWindow.isMaximized() }
})

ipcMain.handle("window:is-maximized", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false
  return mainWindow.isMaximized()
})

ipcMain.handle("window:maximize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.maximize()
})

ipcMain.handle("window:unmaximize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.unmaximize()
})

ipcMain.handle("window:hide", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
})

ipcMain.handle("window:quit", () => {
  app.isQuitting = true
  closeDatabase()
  app.quit()
})

ipcMain.handle("window:close-to-tray", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const closeBehavior = getSetting("closeBehavior", "tray")
    if (closeBehavior === "quit") {
      app.isQuitting = true
      closeDatabase()
      app.quit()
    } else {
      mainWindow.hide()
    }
  }
})

ipcMain.handle("window:set-always-on-top", (_event, value) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(Boolean(value))
    setSetting("alwaysOnTop", Boolean(value))
    return { success: true, value: mainWindow.isAlwaysOnTop() }
  }
  return { success: false }
})

ipcMain.handle("window:get-always-on-top", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.isAlwaysOnTop()
  }
  return false
})

ipcMain.handle("window:toggle-always-on-top", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const next = !mainWindow.isAlwaysOnTop()
    mainWindow.setAlwaysOnTop(next)
    setSetting("alwaysOnTop", next)
    return { success: true, value: next }
  }
  return { success: false, value: false }
})

ipcMain.handle("window:get-bounds", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.getBounds()
  }
  return null
})

ipcMain.handle("window:set-size", (_event, width, height) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setSize(Math.round(width), Math.round(height))
    return { success: true }
  }
  return { success: false }
})

ipcMain.handle("window:show-popover", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return { success: false }
  positionWindowNearTray()
  mainWindow.show()
  mainWindow.focus()
  return { success: true }
})

ipcMain.handle("notification:show", (_event, { title, body, silent } = {}) => {
  if (!Notification.isSupported()) return { success: false, reason: "unsupported" }
  if (getSetting("notifications", false) === false) {
    return { success: false, reason: "disabled" }
  }
  const n = new Notification({
    title: String(title || ""),
    body: String(body || ""),
    silent: Boolean(silent),
  })
  n.show()
  return { success: true }
})

ipcMain.handle("shell:open-external", (_event, url) => {
  if (typeof url === "string" && /^https?:\/\//.test(url)) {
    shell.openExternal(url)
    return { success: true }
  }
  return { success: false }
})

const IMPORT_EXPORT_FILTERS = {
  json: { name: "JSON", extensions: ["json"] },
  csv: { name: "CSV", extensions: ["csv"] },
  markdown: { name: "Markdown", extensions: ["md", "markdown"] },
}

ipcMain.handle("import-export:save-file", async (_event, { content, format, suggestedName } = {}) => {
  if (typeof content !== "string" || content.length === 0) {
    return { success: false, reason: "empty-content" }
  }
  const filter = IMPORT_EXPORT_FILTERS[format]
  if (!filter) return { success: false, reason: "unknown-format" }

  const defaultName = (typeof suggestedName === "string" && suggestedName)
    ? suggestedName
    : `quickprompts-${new Date().toISOString().slice(0, 10)}`

  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export prompts",
    defaultPath: defaultName,
    filters: [filter, { name: "All files", extensions: ["*"] }],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, reason: "canceled" }
  }

  try {
    fs.writeFileSync(result.filePath, content, "utf-8")
    return { success: true, filePath: result.filePath }
  } catch (err) {
    return { success: false, reason: "write-failed", error: err.message }
  }
})

ipcMain.handle("import-export:open-file", async (_event, { format } = {}) => {
  const filters = Object.values(IMPORT_EXPORT_FILTERS)
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import prompts",
    properties: ["openFile"],
    filters,
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, reason: "canceled" }
  }

  const filePath = result.filePaths[0]
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return { success: true, filePath, content, format: format || null }
  } catch (err) {
    return { success: false, reason: "read-failed", error: err.message }
  }
})
