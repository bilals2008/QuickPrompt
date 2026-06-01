import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  onGlobalSearch: (listener) => {
    const handler = () => listener()
    ipcRenderer.on("app:global-search", handler)
    return () => ipcRenderer.removeListener("app:global-search", handler)
  },
  onNavigate: (listener) => {
    const handler = (_e, route) => listener(route)
    ipcRenderer.on("app:navigate", handler)
    return () => ipcRenderer.removeListener("app:navigate", handler)
  },
  hideWindow: () => ipcRenderer.invoke("app:hideWindow"),
})

contextBridge.exposeInMainWorld("windowAPI", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  unmaximize: () => ipcRenderer.invoke("window:unmaximize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  hide: () => ipcRenderer.invoke("window:hide"),
  closeToTray: () => ipcRenderer.invoke("window:close-to-tray"),
  quit: () => ipcRenderer.invoke("window:quit"),
  setAlwaysOnTop: (value) => ipcRenderer.invoke("window:set-always-on-top", value),
  getAlwaysOnTop: () => ipcRenderer.invoke("window:get-always-on-top"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  getBounds: () => ipcRenderer.invoke("window:get-bounds"),
  setSize: (width, height) => ipcRenderer.invoke("window:set-size", width, height),
  showPopover: () => ipcRenderer.invoke("window:show-popover"),
  onMaximizeChange: (listener) => {
    const handler = (_e, value) => listener(value)
    ipcRenderer.on("window:maximize-changed", handler)
    return () => ipcRenderer.removeListener("window:maximize-changed", handler)
  },
})

contextBridge.exposeInMainWorld("notificationAPI", {
  show: ({ title, body, silent } = {}) =>
    ipcRenderer.invoke("notification:show", { title, body, silent }),
})

contextBridge.exposeInMainWorld("shellAPI", {
  openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
})

contextBridge.exposeInMainWorld("db", {
  health: () => ipcRenderer.invoke("db:health"),
  createPrompt: (data) => ipcRenderer.invoke("db:createPrompt", data),
  getAllPrompts: () => ipcRenderer.invoke("db:getAllPrompts"),
  updatePrompt: (id, data) => ipcRenderer.invoke("db:updatePrompt", id, data),
  deletePrompt: (id) => ipcRenderer.invoke("db:deletePrompt", id),
  getAllTags: () => ipcRenderer.invoke("db:getAllTags"),
  createTag: (name) => ipcRenderer.invoke("db:createTag", name),
  searchPrompts: (query) => ipcRenderer.invoke("db:searchPrompts", query),
  toggleFavorite: (id) => ipcRenderer.invoke("db:toggleFavorite", id),
})

contextBridge.exposeInMainWorld("updateAPI", {
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  getStatus: () => ipcRenderer.invoke("update:get-status"),
  setAutoCheck: (enabled) => ipcRenderer.invoke("update:set-auto-check", enabled),
  getAutoCheck: () => ipcRenderer.invoke("update:get-auto-check"),
  onEvent: (callback) => {
    const handler = (_e, data) => callback(data)
    ipcRenderer.on("update:event", handler)
    return () => ipcRenderer.removeListener("update:event", handler)
  },
})

contextBridge.exposeInMainWorld("settingsAPI", {
  get: (key, fallback) => ipcRenderer.invoke("settings:get", key, fallback),
  set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
})
