# Electron removal

The Electron shell was removed from this repo after the Phase 8 parity gate
passed (2026-11-23, upgrade-in-place release path).

## What was removed

- `electron/` — the Electron main process, preload, database and backup code.
- `dist-electron/` — Electron build output.
- From `package.json`: the `electron`, `electron-builder`, `electron-updater`,
  `sqlite3`, `vite-plugin-electron` and `vite-plugin-electron-renderer`
  dependencies; the electron-builder scripts and `build`/`main` fields; the
  `postinstall` hook.
- From `vite.config.js`: the `vite-plugin-electron` plugin.
- From `src/lib/api/`: the `electron.js` adapter. `index.js` now exports the
  Tauri adapter directly.
- From `api.test.js`: the Electron adapter test.

## What stays

- `docs/migration/` — the historical record of the port.
- Published Electron releases on GitHub — they are the rollback path until the
  Tauri release has one stable cycle. The old Electron DB is untouched.

## Dev commands now

- UI dev server: `npm run dev` (Vite).
- Tauri app: `cargo tauri dev` from `src-tauri/` (after `npm run dev` is up).
- Frontend build: `npm run build`.
