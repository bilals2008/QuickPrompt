# Cutover record

Phase 8 parity gate passed on 2026-11-23 (user confirmed the Tauri build
matches Electron). The chosen release path is **Option 1 — upgrade in place**:
QuickPrompt 3.x ships from the same `bilals2008/QuickPrompt` repo.

- Tauri was merged into `main` (PR #2) and released as 3.0.0, then 3.0.1.
- The Electron shell and its build tooling were removed from this repo now that
  the gate passed; see `electron-removal.md`.
- The published Electron releases remain downloadable as a rollback until the
  Tauri release has one stable cycle. The old Electron DB is untouched.

Related: `docs/migration/phase-8-parity-cutover.md`.
