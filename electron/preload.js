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
  setDefaultSize: (preset) => ipcRenderer.invoke("window:set-default-size", preset),
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

contextBridge.exposeInMainWorld("importExportAPI", {
  saveFile: ({ content, format, suggestedName }) =>
    ipcRenderer.invoke("import-export:save-file", { content, format, suggestedName }),
  openFile: ({ format } = {}) =>
    ipcRenderer.invoke("import-export:open-file", { format }),
})

contextBridge.exposeInMainWorld("db", {
  health: () => ipcRenderer.invoke("db:health"),
  createPrompt: (data) => ipcRenderer.invoke("db:createPrompt", data),
  getAllPrompts: () => ipcRenderer.invoke("db:getAllPrompts"),
  getPromptsPaginated: (options) => ipcRenderer.invoke("db:getPromptsPaginated", options),
  updatePrompt: (id, data) => ipcRenderer.invoke("db:updatePrompt", id, data),
  deletePrompt: (id) => ipcRenderer.invoke("db:deletePrompt", id),
  getAllTags: () => ipcRenderer.invoke("db:getAllTags"),
  createTag: (name) => ipcRenderer.invoke("db:createTag", name),
  searchPrompts: (query) => ipcRenderer.invoke("db:searchPrompts", query),
  toggleFavorite: (id) => ipcRenderer.invoke("db:toggleFavorite", id),
  updatePromptOrder: (updates) => ipcRenderer.invoke("db:updatePromptOrder", updates),
  backup: () => ipcRenderer.invoke("db:backup"),
})

contextBridge.exposeInMainWorld("vaultAPI", {
  health: () => ipcRenderer.invoke("vault:health"),
  create: (data) => ipcRenderer.invoke("vault:create", data),
  list: (options) => ipcRenderer.invoke("vault:list", options),
  get: (id) => ipcRenderer.invoke("vault:get", id),
  update: (id, data) => ipcRenderer.invoke("vault:update", id, data),
  toggleFavorite: (id) => ipcRenderer.invoke("vault:toggleFavorite", id),
  togglePin: (id) => ipcRenderer.invoke("vault:togglePin", id),
  updateOrder: (updates) => ipcRenderer.invoke("vault:updateOrder", updates),
  delete: (id) => ipcRenderer.invoke("vault:delete", id),
  copy: (id) => ipcRenderer.invoke("vault:copy", id),
  listAttachments: (vaultItemId) => ipcRenderer.invoke("vault:attachments:list", vaultItemId),
  createAttachment: (data) => ipcRenderer.invoke("vault:attachments:create", data),
  deleteAttachment: (id) => ipcRenderer.invoke("vault:attachments:delete", id),
  downloadAttachment: (id) => ipcRenderer.invoke("vault:attachments:download", id),
})

contextBridge.exposeInMainWorld("updateAPI", {
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  getStatus: () => ipcRenderer.invoke("update:get-status"),
  setAutoCheck: (enabled) => ipcRenderer.invoke("update:set-auto-check", enabled),
  getAutoCheck: () => ipcRenderer.invoke("update:get-auto-check"),
  setAutoDownload: (enabled) => ipcRenderer.invoke("update:set-auto-download", enabled),
  getAutoDownload: () => ipcRenderer.invoke("update:get-auto-download"),
  onEvent: (callback) => {
    const handler = (_e, data) => callback(data)
    ipcRenderer.on("update:event", handler)
    return () => ipcRenderer.removeListener("update:event", handler)
  },
})

contextBridge.exposeInMainWorld("settingsAPI", {
  get: (key, fallback) => ipcRenderer.invoke("settings:get", key, fallback),
  set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  pickFolder: () => ipcRenderer.invoke("settings:pick-folder"),
})

contextBridge.exposeInMainWorld("fsAPI", {
  readDir: (dirPath) => ipcRenderer.invoke("fs:read-dir", dirPath),
  getDrives: () => ipcRenderer.invoke("fs:get-drives"),
})

contextBridge.exposeInMainWorld("folderAPI", {
  create: (data) => ipcRenderer.invoke("folders:create", data),
  list: () => ipcRenderer.invoke("folders:list"),
  roots: () => ipcRenderer.invoke("folders:roots"),
  children: (parentId) => ipcRenderer.invoke("folders:children", parentId),
  get: (id) => ipcRenderer.invoke("folders:get", id),
  breadcrumb: (folderId) => ipcRenderer.invoke("folders:breadcrumb", folderId),
  rename: (id, name) => ipcRenderer.invoke("folders:rename", id, name),
  update: (id, data) => ipcRenderer.invoke("folders:update", id, data),
  delete: (id) => ipcRenderer.invoke("folders:delete", id),
  search: (query) => ipcRenderer.invoke("folders:search", query),
  addPrompt: (promptId, folderId) => ipcRenderer.invoke("folders:addPrompt", promptId, folderId),
  removePrompt: (promptId, folderId) => ipcRenderer.invoke("folders:removePrompt", promptId, folderId),
  movePrompt: (promptId, fromFolderId, toFolderId) => ipcRenderer.invoke("folders:movePrompt", promptId, fromFolderId, toFolderId),
  getPrompts: (folderId, options) => ipcRenderer.invoke("folders:getPrompts", folderId, options),
  getPromptFolders: (promptId) => ipcRenderer.invoke("folders:getPromptFolders", promptId),
})

contextBridge.exposeInMainWorld("vaultFolderAPI", {
  create: (data) => ipcRenderer.invoke("vault-folders:create", data),
  list: () => ipcRenderer.invoke("vault-folders:list"),
  roots: () => ipcRenderer.invoke("vault-folders:roots"),
  children: (parentId) => ipcRenderer.invoke("vault-folders:children", parentId),
  breadcrumb: (folderId) => ipcRenderer.invoke("vault-folders:breadcrumb", folderId),
  rename: (id, name) => ipcRenderer.invoke("vault-folders:rename", id, name),
  delete: (id) => ipcRenderer.invoke("vault-folders:delete", id),
  addItem: (vaultItemId, folderId) => ipcRenderer.invoke("vault-folders:addItem", vaultItemId, folderId),
  removeItem: (vaultItemId, folderId) => ipcRenderer.invoke("vault-folders:removeItem", vaultItemId, folderId),
  getItems: (folderId, options) => ipcRenderer.invoke("vault-folders:getItems", folderId, options),
  getItemFolders: (vaultItemId) => ipcRenderer.invoke("vault-folders:getItemFolders", vaultItemId),
  search: (query) => ipcRenderer.invoke("vault-folders:search", query),
})
