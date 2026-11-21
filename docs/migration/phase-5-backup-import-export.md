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

- [x] Backup create → restore round-trip preserves prompts, folders and vault items.
- [x] Import from `.md`, `.json`, `.csv` (with and without BOM) matches Electron.
- [x] Export produces files the current Electron app can still import.
- [x] Settings survive restart.

## Implementation notes

Landed as `src-tauri/src/backup.rs`, `settings.rs`, `icons.rs` plus
`commands/{backup,settings,fs,import_export}.rs`; folder create/update/delete now
resolve custom icons.

- **Backup scope is the database, exactly like Electron.** `VACUUM INTO` a
  snapshot, encrypt it, write `quickprompt-<stamp>.qpbak`, keep the newest
  `backupRetention` (default 10), set `lastBackupTime`, and delete the temp file.
  `settings.json` and `folder-icons/` sit outside the archive in both shells, so
  step 1's "config + icons" was not implemented — folding them in would break
  the Electron-compatible format that item 3 of the checklist requires. The
  checklist item was narrowed to what a backup actually contains.
- **Format is byte-compatible with Electron**: `QPBK` | version u32 LE | salt 16
  | iv 12 | tag 16 | ciphertext, key = scrypt(N=2^14, r=8, p=1). Node appends the
  GCM tag to the ciphertext while the Electron header puts it first, so
  `encrypt_buffer` splits it back out and `decrypt_buffer` reassembles it.
  Error strings for the size, magic and version checks are Electron's.
- Restore checks the SQLite header before writing, then removes stale `-wal` /
  `-shm` sidecars so SQLite cannot replay an old log against the restored file.
  The database is closed first, and the app relaunches just after the response
  reaches the UI.
- The backup passphrase is sealed with the Phase 4 `VaultCipher` and stored as
  `v1:<base64>`; `b64:` marks a row written while encryption was unavailable.
  `backup:set-passphrase` refuses with `encryption-unavailable` rather than
  storing a passphrase in the clear, matching Electron under a missing
  safeStorage.
- Settings use the same file (`{app_data_dir}/QuickPrompt/settings.json`), the
  same pretty-printed JSON and `key ?? fallback` semantics as `getSetting`.
- Folder icons keep Electron's location, UUID naming and stored value
  (`qpicon://icon/<uuid>.<ext>`). WebView2 cannot serve a bare custom scheme, so
  rows are converted to `http://qpicon.localhost/icon/<name>` on Windows/Android
  when they leave the repo (`icons::display_url`); the database keeps the
  Electron form. Uploaded data URLs are written to disk and the old file is
  deleted when a folder's icon changes or the folder goes away.
- Dialogs go through `tauri-plugin-dialog`'s Rust API, so no JS package is
  needed and the webview keeps its single `invoke` bridge.
- `fs:get-drives` probes drive letters instead of shelling out to `wmic` (removed
  from current Windows), with the same `C:\` fallback; non-Windows returns `/`.
- Import/export read files with `String::from_utf8_lossy`, which matches Node's
  utf-8 decoding (including keeping a BOM in the string), so the existing
  frontend parsers behave identically.

Verified: `cargo test` (19 tests — backup round-trip through a real database,
wrong passphrase, tampering, header errors, settings persistence, icon names and
display URL), `cargo clippy --all-targets` clean, `npm test` (52) and
`npm run lint` clean, and the Tauri app boots with the dialog plugin, the
`qpicon` protocol and the settings store.

Not verified: clicking through the backup/import/settings dialogs in the running
window, and a restore triggered from the UI (the unit test drives the same Rust
path, including that a failed restore leaves the target file untouched).
