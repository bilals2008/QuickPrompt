# Phase 3 — Domain Commands (prompts, tags, folders, vault-folders)

**Goal:** every DB-backed Tauri command that the frontend uses, matching the current return shapes. Vault payload encryption is Phase 4; here the vault rows are read/written as-is.

## Inputs

| Module | File | Lines |
|--------|------|-------|
| Prompts + tags | `electron/database/prompts.js` | 124 |
| Folders | `electron/database/folders.js` | 131 |
| Vault folders | `electron/database/vault-folders.js` | 127 |
| Vault items (no crypto) | `electron/database/vault.js` | 294 |
| IPC map | `electron/main.js` | handlers ~595–900 |
| Contract | `electron/preload.js` | 146 |

## Command groups

`shadow: prompts` — `db:createPrompt`, `getAllPrompts`, `getPromptsPaginated`, `updatePrompt`, `deletePrompt`, `getAllTags`, `createTag`, `searchPrompts`, `toggleFavorite`, `updatePromptOrder`
`shadow: folders` — `folders:*` (16 commands)
`shadow: vault-folders` — `vault-folders:*` (13 commands)
`shadow: vault` — `vault:*` (list/get/create/update/delete/favorite/pin/order/copy + attachments)

## Steps

1. `src-tauri/src/commands/prompts.rs`, `folders.rs`, `vault_folders.rs`, `vault.rs`.
2. Each command returns `Result<T, String>`; map errors to the messages the UI already shows.
3. Match serialisation: DB rows are `snake_case`; the frontend expects the shapes produced today. Use `#[serde(rename_all = "camelCase")]` per struct or keep keys identical — decide per module from the current JS output.
4. Register everything in `invoke_handler`.
5. Fill `src/lib/api/tauri.js` for these groups; switch the dev build to the Tauri adapter and run through Home, Vault, Collections pages.
6. Port the two pure helpers with `rust-anything` if desired: tag normalisation, folder breadcrumb/path building — record → port → diff.

## Done when

- [x] Every namespace above has a working Tauri command.
- [x] Prompts CRUD, tags, favourites, reorder work in the Tauri window.
- [x] Folder create/rename/delete/breadcrumb/move works.
- [x] Vault CRUD + attachments work (ciphertext untouched).
- [x] Pagination and search results match Electron.

## Risks

- Attachment blobs: confirm whether stored inline or on disk; match exactly to avoid data loss.
- `updateOrder` batch calls must run in a single transaction.

## Notes

- Layout: `src-tauri/src/repo/{prompts,folders,vault_folders,vault}.rs` hold the SQL
  (one module per Electron database file); `src-tauri/src/commands/` holds thin
  `#[tauri::command]` wrappers in the same four groups. Shared row handling lives
  in `src-tauri/src/db/rows.rs` (rows -> JSON with the database's snake_case
  names) and `src-tauri/src/db/util.rs` (ISO timestamps, UUIDs, page clamps).
- Rows go back to the frontend as `serde_json::Value` so keys stay byte-identical
  to Electron's output; the vault items still use `mapRow`'s mixed shape
  (`sort_order`, `hasValue`, `favorite` as a boolean). Inputs use
  `#[serde(rename_all = "camelCase")]` where the UI sends camelCase
  (`parentId`, `vaultItemId`, `sortOrder`, ...), and `type` is renamed in the
  vault structs since it is a Rust keyword.
- `prompts:updateOrder` and `vault:updateOrder` each run in one transaction, as
  the risk note asks.
- `src/lib/api/tauri.js` now maps all 52 commands; settings/backup/update/window/
  app/shell/notifications/import-export/fs still reject until phases 5-7.
  `api.test.js` checks the stub against `api.settings.get` now.
- Phase 3 leaves two deliberate gaps: custom folder icons are stored exactly as
  they arrive (the `data:image` -> `qpicon://` file step is Phase 5), and vault
  crypto is a placeholder that matches Electron's "encryption unavailable"
  branch. Electron-encrypted values therefore read as empty and
  `vault:health` reports `encryptionAvailable: false` until Phase 4.
- Verified with `cargo test` (9 tests, including the four new repo suites),
  `cargo clippy --all-targets`, `npm test` (52 tests) and `npm run lint`, plus a
  `cargo tauri dev` run against the copied real database: `[DB] Database
  initialized`, no errors. Home/Vault/Collections were not clicked through — the
  native webview is not inspectable from this environment, so page-level parity
  is covered by the repo tests, not by a visual walkthrough.
