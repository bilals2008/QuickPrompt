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

- [ ] App opens a **copy** of a real `quickprompt.db` with no schema errors.
- [ ] `integrity_check` returns `ok`; pragma values verified via a test query.
- [ ] Corrupt-file path triggers recovery instead of a crash.
- [ ] Table list matches `schema.js` exactly.

## Risks

- `sqlite3` async wrapper resolves with the statement object; Rust returns rows. Return shapes are reconciled in Phase 3, not here.
- Keep the WAL sidecar (`-wal`, `-shm`) out of backup copies unless checkpointed first.
