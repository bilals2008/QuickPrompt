import { describe, expect, it } from "vitest"

describe("api adapter", () => {
  it("forwards every Electron namespace unchanged", async () => {
    const namespaces = {
      db: {},
      folderAPI: {},
      vaultAPI: {},
      vaultFolderAPI: {},
      backupAPI: {},
      settingsAPI: {},
      updateAPI: {},
      windowAPI: {},
      electronAPI: {},
      shellAPI: {},
      notificationAPI: {},
      importExportAPI: {},
      fsAPI: {},
    }
    globalThis.window = namespaces
    const { api } = await import("./electron.js")

    expect(api.prompts).toBe(namespaces.db)
    expect(api.folders).toBe(namespaces.folderAPI)
    expect(api.vault).toBe(namespaces.vaultAPI)
    expect(api.vaultFolders).toBe(namespaces.vaultFolderAPI)
    expect(api.backup).toBe(namespaces.backupAPI)
    expect(api.settings).toBe(namespaces.settingsAPI)
    expect(api.update).toBe(namespaces.updateAPI)
    expect(api.window).toBe(namespaces.windowAPI)
    expect(api.app).toBe(namespaces.electronAPI)
    expect(api.shell).toBe(namespaces.shellAPI)
    expect(api.notifications).toBe(namespaces.notificationAPI)
    expect(api.importExport).toBe(namespaces.importExportAPI)
    expect(api.fs).toBe(namespaces.fsAPI)
  })

  it("Tauri stubs reject with a readable error and keep unsubscribe shape", async () => {
    const { api } = await import("./tauri.js")

    await expect(api.prompts.getPromptsPaginated()).rejects.toThrow("not implemented in Tauri yet")
    expect(typeof api.update.onEvent(() => {})).toBe("function")
  })
})
