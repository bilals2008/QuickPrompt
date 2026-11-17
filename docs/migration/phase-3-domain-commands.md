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

- [ ] Every namespace above has a working Tauri command.
- [ ] Prompts CRUD, tags, favourites, reorder work in the Tauri window.
- [ ] Folder create/rename/delete/breadcrumb/move works.
- [ ] Vault CRUD + attachments work (ciphertext untouched).
- [ ] Pagination and search results match Electron.

## Risks

- Attachment blobs: confirm whether stored inline or on disk; match exactly to avoid data loss.
- `updateOrder` batch calls must run in a single transaction.
