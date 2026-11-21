# Phase 2 — Database Layer (rusqlite)

**Goal:** open the existing SQLite file with Rust, same schema, same durability settings. No feature commands yet — just connection, schema and integrity.

## Inputs

- `electron/database/db.js` (143 lines) — connection, pragmas, integrity check, recovery.
- `electron/database/schema.js` (114 lines) — tables and migrations.

## Steps

1. Add `rusqlite` with the `bundled` feature (ships SQLite; no system dependency).
2. Create `src-tauri/src/db/mod.rs`:
   - Managed `Mutex<Connection>` in Tauri state.
   - Path: `app_data_dir()/QuickPrompt/quickprompt.db` (create dir if missing).
3. Re-apply every pragma from `configurePragmas`: `journal_mode=WAL`, `synchronous=FULL`, `fullfsync=ON`, `busy_timeout=5000`, `journal_size_limit=67108864`, `foreign_keys=ON`. Order matters — apply before DDL.
4. Port `verifyIntegrity` (`PRAGMA integrity_check(1)`) and `tryRecover` (`PRAGMA wal_checkpoint(TRUNCATE)` then re-check).
5. Port `createTables` verbatim from `schema.js`; keep table/column/index names byte-identical.
6. Port `closeDatabase`: WAL checkpoint + `PRAGMA optimize` on shutdown.
7. Expose a temporary `db:health` command returning the same shape as the Electron one.

## Done when

- [x] App opens a **copy** of a real `quickprompt.db` with no schema errors.
- [x] `integrity_check` returns `ok`; pragma values verified via a test query.
- [x] Corrupt-file path triggers recovery instead of a crash.
- [x] Table list matches `schema.js` exactly.

## Risks

- `sqlite3` async wrapper resolves with the statement object; Rust returns rows. Return shapes are reconciled in Phase 3, not here.
- Keep the WAL sidecar (`-wal`, `-shm`) out of backup copies unless checkpointed first.

## Notes

- Layout: `src-tauri/src/db/mod.rs` (path, pragmas, integrity/recovery, state, close),
  `src-tauri/src/db/schema.rs` (DDL + migrations, copied verbatim),
  `src-tauri/src/db/tests.rs` (the checks below), `src-tauri/src/commands/db.rs`
  (`db_health`).
- `DbState` holds `Mutex<Option<Connection>>` plus the init error, so a failed
  open is reported through `db:health` instead of taking the app down — same
  `dbReady`/`dbError` behaviour as Electron. Later phases use
  `DbState::with_conn` to run statements.
- Frontend: `api.prompts.health()` in `src/lib/api/tauri.js` invokes `db_health`
  via `window.__TAURI_INTERNALS__.invoke`; the rest of the adapter still rejects
  until Phases 3-7.
- `cargo test` (5 tests) and `cargo clippy --all-targets` pass. The real-database
  test copies `%APPDATA%/QuickPrompt/QuickPrompt/quickprompt.db` when present and
  skips elsewhere. A copy was also placed at
  `%APPDATA%/com.quickprompt.app/QuickPrompt/quickprompt.db` for the dev run;
  `cargo tauri dev` logged `[DB] Database initialized` and created the `-wal`/
  `-shm` sidecars (WAL active).
- A real database still contains legacy `notes`, `note_folders` and
  `note_note_folders` tables that `schema.js` no longer creates. The schema does
  not drop them.
- Tauri's `app_data_dir()` is `%APPDATA%/com.quickprompt.app` on Windows, while
  Electron uses `%APPDATA%/QuickPrompt` — the existing-data move belongs to the
  Phase 8 data migration.
