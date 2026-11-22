# QuickPrompt → Tauri + Rust — Migration Plans

Scratch workspace for migrating QuickPrompt from **Electron + Node/SQLite3** to **Tauri 2 + Rust + rusqlite**.

The original app at `D:\Dev\QuickPrompt` stays as-is and keeps shipping. This folder is the dedicated migration copy. Nothing here touches the original until the parity gate (Phase 8) passes.

## Ground rules

1. **Reference first.** The Electron app is the behavioural reference until Phase 8. Keep it runnable (`npm run dev`).
2. **One namespace at a time.** Port one `window.*` API namespace end-to-end, then verify.
3. **Same data layout.** DB must stay at `{app_data_dir}/QuickPrompt/quickprompt.db` so existing user data opens unchanged.
4. **No behaviour drift.** Return shapes, key casing and error messages must match what the React code already expects.
5. **Gate per phase.** A phase is done only when its checklist is green; commit at that point.

## Scope

| Part | Files | Lines | Port effort |
|------|-------|-------|-------------|
| Electron backend | 10 JS files | ~2,320 | Full rewrite in Rust |
| React frontend | 93 files | ~14,400 | Mostly reused; ~150 IPC call sites re-pointed |

Frontend API namespaces in use (call sites): `settingsAPI` 49, `folderAPI` 23, `db` 20, `vaultFolderAPI` 18, `vaultAPI` 17, `updateAPI` 11, `backupAPI` 5, `electronAPI` 3, `shellAPI` 2, `windowAPI` 2.

## Phase order

| Phase | File | Goal | Risk |
|-------|------|------|------|
| 0 | [phase-0-scaffold.md](phase-0-scaffold.md) | Scratch baseline + Tauri shell | Low |
| 1 | [phase-1-bridge-abstraction.md](phase-1-bridge-abstraction.md) | Isolate all IPC behind one adapter | Low |
| 2 | [phase-2-database.md](phase-2-database.md) | rusqlite layer, same schema/pragmas | Medium |
| 3 | [phase-3-domain-commands.md](phase-3-domain-commands.md) | prompts / tags / folders / vault-folders | Medium |
| 4 | [phase-4-vault-encryption.md](phase-4-vault-encryption.md) | safeStorage → keyring + AES-GCM | **High** |
| 5 | [phase-5-backup-import-export.md](phase-5-backup-import-export.md) | backup, import/export, settings, fs | Medium |
| 6 | [phase-6-window-tray-shortcuts.md](phase-6-window-tray-shortcuts.md) | window, tray, menu, shortcuts, notifications | Medium |
| 7 | [phase-7-updater-packaging.md](phase-7-updater-packaging.md) | updater, bundler, signing | Medium |
| 8 | [phase-8-parity-cutover.md](phase-8-parity-cutover.md) | parity gate, data migration, release | Low |

## About `rust-anything`

Installed and wired in this machine's OpenCode config. It ports **pure logic** units to Rust with behaviour checks. Useful for: import/export parsers, tag/search helpers, backup crypto. It does **not** convert Electron APIs to Tauri — Phases 2–7 are hand-written Rust. Use `rust-anything analyze` as a second opinion on the pure modules only.
