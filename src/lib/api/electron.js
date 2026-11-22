// Electron adapter: forwards to the namespaces electron/preload.js exposes.
// Keep the method names identical — the preload file is the contract.
export const api = {
  prompts: window.db,
  folders: window.folderAPI,
  vault: window.vaultAPI,
  vaultFolders: window.vaultFolderAPI,
  backup: window.backupAPI,
  settings: window.settingsAPI,
  update: window.updateAPI,
  window: window.windowAPI,
  app: window.electronAPI,
  shell: window.shellAPI,
  notifications: window.notificationAPI,
  importExport: window.importExportAPI,
  fs: window.fsAPI,
}
