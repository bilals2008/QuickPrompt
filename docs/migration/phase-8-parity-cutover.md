# Phase 8 — Parity Gate & Cutover

**Goal:** prove the Tauri build matches Electron feature-for-feature, migrate real data safely, then decide the release path.

## Status (2026-11-23)

Complete. The user ran the parity checks on the real app and confirmed the
Tauri build matches Electron. The migration is done and the release path was
"upgrade in place": QuickPrompt 3.x ships from the same repo with Tauri.

Because the gate passed, the Electron shell and its build tooling were removed
from this repo (see `docs/agents/electron-removal.md`). The Electron DB and the
published Electron releases stay untouched as a rollback path.

Only when every box above is green does Phase 8 — and the migration — complete.

## Parity checklist

Run both builds side by side on the same data (or a copy). Tick every row:

- [x] Prompts: create, edit, delete, favourite, multi-select, reorder (drag + keyboard), grid/list.
- [x] Tags: autocomplete, colours, filter.
- [x] Search: content + tags, spotlight, settings search.
- [x] Folders: create, rename, delete, move, breadcrumb, custom icons/colours, bulk move.
- [x] Vault: create, edit, delete, pin, favourite, reorder, copy, attachments.
- [x] Vault folders: same as folders.
- [x] Backup: export → import → identical data.
- [x] Import/Export: all three formats, BOM, folder restore.
- [x] Themes: all five.
- [x] Window: tray, close/minimize-to-tray, always-on-top, size presets, popover, splash.
- [x] Global search shortcut.
- [x] Notifications, open-external.
- [x] Updater flow.
- [x] Onboarding flow.
- [x] App version + platform display.

## Data migration

1. On the Electron app: *Export* an encrypted backup.
2. On the Tauri app: *Restore* that file.
3. Verify row counts and spot-check vault decryption.
4. Keep the Electron DB untouched as a rollback.

## Cutover

1. **Release path chosen — Option 1 (upgrade in place):** QuickPrompt 3.x ships
   from the same `bilals2008/QuickPrompt` repo, replacing Electron. Tauri was
   merged into `main` (PR #2) and released as 3.0.0, then 3.0.1.
2. The Electron shell and its build tooling were removed from this repo because
   the gate passed. The published Electron releases stay downloadable as a
   rollback until the Tauri release has one stable cycle.
3. Monitor crash reports and update adoption for one release cycle.

## Done when

- [x] Every checklist box is green.
- [x] A real user backup restores perfectly.
- [x] Installer tested on a clean Windows machine (and macOS if shipping it).
- [x] Release decision recorded: upgrade in place, QuickPrompt 3.x from the same repo.

## Risks

- The vault path was proven with real data before shipping — it is the only
  irreversible data path.
- Keep the published Electron releases downloadable until the Tauri release has
  one stable cycle; a rollback restores the old DB unchanged.
