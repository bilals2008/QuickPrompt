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

- [ ] No direct `window.<namespace>` access outside `src/lib/api/`.
- [ ] Electron app behaves identically (manual smoke of all pages).
- [ ] Lint rule fails if a new direct call is added.

## Notes

- This is the cheapest phase and pays off everywhere. Do not skip it.
- `electronAPI.onGlobalSearch` / `onNavigate` / `updateAPI.onEvent` return unsubscribe functions — the adapter must preserve that shape.
