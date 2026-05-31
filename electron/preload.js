import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
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
