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
})
