// Tauri adapter. Tauri 2 injects `__TAURI_INTERNALS__` into every webview, so
// `invoke` works without the @tauri-apps/api package (still deliberately absent).
const invoke = (command, args) => window.__TAURI_INTERNALS__.invoke(command, args)

// Commands that exist in Rust today. Groups still missing (update) keep
// rejecting with a readable error until phase 7 fills them in.
const IMPLEMENTED = {
  prompts: {
    health: () => invoke("db_health"),
    createPrompt: (data) => invoke("prompts_create", { data }),
    getAllPrompts: () => invoke("prompts_get_all"),
    getPromptsPaginated: (options) => invoke("prompts_get_paginated", { options }),
    updatePrompt: (id, data) => invoke("prompts_update", { id, data }),
    deletePrompt: (id) => invoke("prompts_delete", { id }),
    getAllTags: () => invoke("prompts_get_all_tags"),
    createTag: (name) => invoke("prompts_create_tag", { name }),
    searchPrompts: (query) => invoke("prompts_search", { query }),
    toggleFavorite: (id) => invoke("prompts_toggle_favorite", { id }),
    updatePromptOrder: (updates) => invoke("prompts_update_order", { updates }),
  },
  folders: {
    create: (data) => invoke("folders_create", { data }),
    list: () => invoke("folders_list"),
    roots: () => invoke("folders_roots"),
    children: (parentId) => invoke("folders_children", { parentId }),
    get: (id) => invoke("folders_get", { id }),
    breadcrumb: (folderId) => invoke("folders_breadcrumb", { folderId }),
    rename: (id, name) => invoke("folders_rename", { id, name }),
    update: (id, data) => invoke("folders_update", { id, data }),
    delete: (id) => invoke("folders_delete", { id }),
    search: (query) => invoke("folders_search", { query }),
    addPrompt: (promptId, folderId) => invoke("folders_add_prompt", { promptId, folderId }),
    removePrompt: (promptId, folderId) => invoke("folders_remove_prompt", { promptId, folderId }),
    movePrompt: (promptId, fromFolderId, toFolderId) =>
      invoke("folders_move_prompt", { promptId, fromFolderId, toFolderId }),
    getPrompts: (folderId, options) => invoke("folders_get_prompts", { folderId, options }),
    getPromptFolders: (promptId) => invoke("folders_get_prompt_folders", { promptId }),
  },
  vaultFolders: {
    create: (data) => invoke("vault_folders_create", { data }),
    list: () => invoke("vault_folders_list"),
    roots: () => invoke("vault_folders_roots"),
    children: (parentId) => invoke("vault_folders_children", { parentId }),
    breadcrumb: (folderId) => invoke("vault_folders_breadcrumb", { folderId }),
    rename: (id, name) => invoke("vault_folders_rename", { id, name }),
    update: (id, data) => invoke("vault_folders_update", { id, data }),
    delete: (id) => invoke("vault_folders_delete", { id }),
    addItem: (vaultItemId, folderId) =>
      invoke("vault_folders_add_item", { vaultItemId, folderId }),
    removeItem: (vaultItemId, folderId) =>
      invoke("vault_folders_remove_item", { vaultItemId, folderId }),
    getItems: (folderId, options) => invoke("vault_folders_get_items", { folderId, options }),
    getItemFolders: (vaultItemId) => invoke("vault_folders_get_item_folders", { vaultItemId }),
    search: (query) => invoke("vault_folders_search", { query }),
  },
  vault: {
    health: () => invoke("vault_health"),
    create: (data) => invoke("vault_create", { data }),
    list: (options) => invoke("vault_list", { options }),
    get: (id) => invoke("vault_get", { id }),
    update: (id, data) => invoke("vault_update", { id, data }),
    toggleFavorite: (id) => invoke("vault_toggle_favorite", { id }),
    togglePin: (id) => invoke("vault_toggle_pin", { id }),
    updateOrder: (updates) => invoke("vault_update_order", { updates }),
    delete: (id) => invoke("vault_delete", { id }),
    copy: (id) => invoke("vault_copy", { id }),
    listAttachments: (vaultItemId) => invoke("vault_attachments_list", { vaultItemId }),
    createAttachment: (data) => invoke("vault_attachments_create", { data }),
    deleteAttachment: (id) => invoke("vault_attachments_delete", { id }),
    downloadAttachment: (id) => invoke("vault_attachments_download", { id }),
  },
  backup: {
    create: () => invoke("backup_create"),
    restore: (filePath, passphrase) => invoke("backup_restore", { filePath, passphrase }),
    pickFile: () => invoke("backup_pick_file"),
    setPassphrase: (passphrase) => invoke("backup_set_passphrase", { passphrase }),
    hasPassphrase: () => invoke("backup_has_passphrase"),
  },
  settings: {
    get: (key, fallback = null) => invoke("settings_get", { key, fallback }),
    set: (key, value) => invoke("settings_set", { key, value }),
    pickFolder: () => invoke("settings_pick_folder"),
  },
  fs: {
    readDir: (dirPath) => invoke("fs_read_dir", { dirPath }),
    getDrives: () => invoke("fs_get_drives"),
  },
  importExport: {
    saveFile: ({ content, format, suggestedName } = {}) =>
      invoke("import_export_save_file", { content, format, suggestedName }),
    openFile: ({ format } = {}) => invoke("import_export_open_file", { format }),
  },
  window: {
    minimize: () => invoke("window_minimize"),
    maximize: () => invoke("window_maximize"),
    unmaximize: () => invoke("window_unmaximize"),
    toggleMaximize: () => invoke("window_toggle_maximize"),
    isMaximized: () => invoke("window_is_maximized"),
    hide: () => invoke("window_hide"),
    closeToTray: () => invoke("window_close_to_tray"),
    quit: () => invoke("window_quit"),
    setAlwaysOnTop: (value) => invoke("window_set_always_on_top", { value }),
    getAlwaysOnTop: () => invoke("window_get_always_on_top"),
    toggleAlwaysOnTop: () => invoke("window_toggle_always_on_top"),
    getBounds: () => invoke("window_get_bounds"),
    setSize: (width, height) => invoke("window_set_size", { width, height }),
    setDefaultSize: (preset) => invoke("window_set_default_size", { preset }),
    showPopover: () => invoke("window_show_popover"),
  },
  app: {
    getAppVersion: () => invoke("app_get_version"),
    getPlatform: () => invoke("app_get_platform"),
    hideWindow: () => invoke("app_hide_window"),
    relaunch: () => invoke("app_relaunch"),
  },
  shell: {
    openExternal: (url) => invoke("shell_open_external", { url }),
  },
  notifications: {
    show: ({ title, body, silent } = {}) =>
      invoke("notification_show", { title, body, silent }),
  },
}

const pending = (path) => () => Promise.reject(new Error(`${path} is not implemented in Tauri yet`))

// Event subscriptions must return an unsubscribe function, not a promise.
// Rust reaches the webview by dispatching DOM events (see `window::emit` in
// src-tauri/src), so the event plugin is not needed.
const domEvent = (name) => (listener) => {
  const handler = (event) => listener(event.detail)
  window.addEventListener(name, handler)
  return () => window.removeEventListener(name, handler)
}

const noop = () => () => {}

const SUBSCRIPTIONS = {
  onNavigate: domEvent("qp:navigate"),
  onGlobalSearch: domEvent("qp:global-search"),
  // Maximise is disabled and updates are not wired yet, so nothing fires.
  onMaximizeChange: noop,
  onEvent: noop,
}

export const api = new Proxy(
  {},
  {
    get: (_target, group) =>
      new Proxy(
        {},
        {
          get: (_group, method) => {
            const name = String(group)
            const key = String(method)
            const implemented = IMPLEMENTED[name]?.[key]
            if (implemented) return implemented
            const subscription = SUBSCRIPTIONS[key]
            if (subscription) return subscription
            return pending(`${name}.${key}`)
          },
        },
      ),
  },
)
