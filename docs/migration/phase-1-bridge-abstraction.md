# Phase 1 — Frontend Bridge Abstraction

**Goal:** every `window.<namespace>` call goes through one adapter module. The React app still runs on Electron, but can now switch to Tauri by swapping the adapter.

This phase touches only `src/`. It de-risks everything after it.

## Steps

1. Create `src/lib/api/`:
   - `index.js` — exports `api` with typed groups: `api.prompts`, `api.folders`, `api.vault`, `api.vaultFolders`, `api.backup`, `api.settings`, `api.update`, `api.window`, `api.app`, `api.shell`, `api.notifications`, `api.importExport`, `api.fs`.
   - `electron.js` — current behaviour, forwarding to the existing `window.*` namespaces.
   - `tauri.js` — same methods via `invoke()` (stubs until Phases 2–7 fill the Rust side).
2. Pick adapter at startup: `window.__TAURI__ ? tauri : electron`. Export a single `api`.
3. Replace all direct calls (~150 sites) with `api.*`:
   - `settingsAPI` 49, `folderAPI` 23, `db` 20, `vaultFolderAPI` 18, `vaultAPI` 17, `updateAPI` 11, `backupAPI` 5, `electronAPI` 3, `shellAPI` 2, `windowAPI` 2.
4. Keep `electron/preload.js` untouched — it stays the Electron contract.
5. Add a lint guard: forbid `window.db`, `window.*API` outside `src/lib/api/` (an ESLint `no-restricted-globals`/`no-restricted-syntax` rule).

## Done when

- [x] No direct `window.<namespace>` access outside `src/lib/api/` (ESLint `no-restricted-syntax`).
- [x] Electron app behaves identically (Home: 107 prompts + tags + settings; Collections: 16 folders).
- [x] Lint rule fails if a new direct call is added (checked with a throwaway file).

## Notes

- This is the cheapest phase and pays off everywhere. Do not skip it.
- `electronAPI.onGlobalSearch` / `onNavigate` / `updateAPI.onEvent` return unsubscribe functions — the adapter must preserve that shape. The Tauri stubs return no-op unsubscribe functions for these.
- Step 2 uses `window.__TAURI_INTERNALS__` instead of `window.__TAURI__`: Tauri 2 injects the former into every webview even with the global JS API off, so no `tauri.conf.json` change is needed.
- `src/lib/api/tauri.js` rejects every call with a readable "not implemented in Tauri yet" error until phases 2-7 add real commands. `@tauri-apps/api` is deliberately not installed yet.
- `npm test` (52 tests) and `npm run lint` pass. Visual smoke covered Home and Collections; Settings/Vault/Import-Export use the same forwarding pairs and are covered by the adapter unit test, not by a visual walkthrough.
