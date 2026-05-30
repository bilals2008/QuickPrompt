import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron"
import path from "node:path"
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
} from "./database/prompts.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, "../dist")
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, "../public")

let mainWindow
let tray
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]
const isMac = process.platform === "darwin"

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
    width: 420,
    height: 560,
    minWidth: 340,
    minHeight: 400,
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    skipTaskbar: isMac,
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

app.whenReady().then(async () => {
  if (isMac) {
    app.dock.hide()
  }

  try {
    await initDatabase()
    console.log("[Main] Database ready")
  } catch (err) {
    console.error("[Main] Database init failed:", err)
  }

  createWindow()
  createTray()

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
