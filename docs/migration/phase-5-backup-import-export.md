# Phase 5 — Backup, Import/Export, Settings, Filesystem

**Goal:** port the non-domain backends: encrypted backup, file import/export, settings persistence, folder-icon and filesystem helpers.

## Inputs

| Module | File | Lines |
|--------|------|-------|
| Backup | `electron/backup.js` | 117 |
| Folder icons | `electron/folder-icons.js` | 89 |
| Settings + handlers | `electron/main.js` (`settings:*`, `import-export:*`, `fs:*`) | — |
| Frontend formats | `src/features/import-export/` | — |

## Commands to port

- `backup:create`, `backup:restore`, `backup:pick-file`, `backup:set-passphrase`, `backup:has-passphrase`
- `import-export:save-file`, `import-export:open-file`
- `settings:get`, `settings:set`, `settings:pick-folder`
- `fs:read-dir`, `fs:get-drives`
- `folders:update` icon handling (uses `folder-icons.js`)

## Steps

1. Backup: reuse Phase 4 crypto. Whole-file export (DB checkpoint + config + icons) as an encrypted archive; restore replaces data dir then relaunches.
2. Dialogs: `tauri-plugin-dialog` for open/save/folder pickers. Return the same `{ canceled, filePath }` shape.
3. Settings: JSON file at `app_data_dir()/QuickPrompt/settings.json` (same path as Electron) or `tauri-plugin-store`. Keep keys identical.
4. Import/export: parsing already lives in the frontend; only the file read/write moves to Rust/plugins. Ensure `.md/.json/.csv` and BOM handling still match.
5. `fs:get-drives`: enumerate Windows drives; map `/` and `/Volumes` on other platforms.
6. Folder icons: same on-disk location and naming as Electron.

## Done when

- [ ] Backup create → restore round-trip preserves prompts, folders, vault, settings, icons.
- [ ] Import from `.md`, `.json`, `.csv` (with and without BOM) matches Electron.
- [ ] Export produces files the current Electron app can still import.
- [ ] Settings survive restart.

## Risks

- Restore must checkpoint WAL before copying, or the backup misses recent writes.
- Never overwrite the live DB until the new file passed an integrity check.
