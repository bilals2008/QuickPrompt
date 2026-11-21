import { api as electron } from "./electron"
import { api as tauri } from "./tauri"

// Tauri 2 injects __TAURI_INTERNALS__ into every webview, even with the global
// JS API turned off. Electron's preload is the only thing that defines its own.
export const api = window.__TAURI_INTERNALS__ ? tauri : electron
