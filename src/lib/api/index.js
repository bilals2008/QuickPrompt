import { api as tauri } from "./tauri"

// Tauri 2 injects __TAURI_INTERNALS__ into every webview. The UI reaches native
// features only through this adapter (api.*), never window.* directly.
export const api = tauri
