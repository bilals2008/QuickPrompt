# Repo overview

QuickPrompt is a desktop prompt manager. It started on Electron + Node/SQLite3
and is now Tauri 2 + Rust + rusqlite. The migration is complete (Phase 8 gate
passed, upgrade-in-place release path chosen).

## Layout

- `src/` — React UI shared by the app.
- `src-tauri/` — the Tauri 2 shell (Rust commands, DB, vault, updater, tray).
- `src/lib/api/` — IPC adapter. The UI talks to `api.*`, never `window.*`.
- `docs/migration/` — phase plans and ground rules (`README.md`). The
  migration is historical now; keep it as the record of how the port was done.
- `.github/workflows/release.yml` — tag-triggered release builds.

## Data layout

The DB stays at `{app_data_dir}/QuickPrompt/quickprompt.db` so data written by
the old Electron app opens unchanged. Settings live next to it in
`settings.json`. See `docs/agents/data-and-security.md`.
