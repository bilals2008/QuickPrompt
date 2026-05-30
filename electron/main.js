import { app, BrowserWindow, ipcMain } from "electron"
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
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, "index.html"))
  }
}

app.whenReady().then(async () => {
  try {
    await initDatabase()
    console.log("[Main] Database ready")
  } catch (err) {
    console.error("[Main] Database init failed:", err)
  }
  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("before-quit", () => {
  closeDatabase()
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
