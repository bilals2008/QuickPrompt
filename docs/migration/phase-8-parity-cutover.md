# Phase 8 — Parity Gate & Cutover

**Goal:** prove the Tauri build matches Electron feature-for-feature, migrate real data safely, then decide the release path.

## Status (2026-11-22)

Not started — Phase 8 is a parity gate, not a coding phase. All checklist
boxes below are unchecked until a person runs both shells side by side on the
same data and a clean Windows machine, plus macOS if shipping.

The code-side prerequisites are complete (Phases 0–7 all committed), so nothing
new needs to be written: prompts, tags, search, folders, vault, backup,
import/export, themes, window/tray, global shortcut, notifications, updater,
version + platform display, and onboarding are all ported. Data migration uses
the existing encrypted backup → restore flow.

What remains (human + real machines):

- Run Electron and Tauri side by side on a copy of real data; tick every
  parity row (prompts, tags, search, folders, vault, vault folders, backup,
  import/export, themes, window, global search shortcut, notifications,
  updater flow, onboarding, version + platform).
- Restore a real user's encrypted backup in Tauri; verify row counts and vault
  decryption; keep the Electron DB untouched as rollback.
- Test the installer on a clean Windows machine (and macOS if shipping it).
- Record the release decision (upgrade in place as 3.0.0 vs new product) in
  this folder; tag the Electron repo final release and keep it read-only.

Only when every box above is green does Phase 8 — and the migration — complete.

## Parity checklist

Run both builds side by side on the same data (or a copy). Tick every row:

- [ ] Prompts: create, edit, delete, favourite, multi-select, reorder (drag + keyboard), grid/list.
- [ ] Tags: autocomplete, colours, filter.
- [ ] Search: content + tags, spotlight, settings search.
- [ ] Folders: create, rename, delete, move, breadcrumb, custom icons/colours, bulk move.
- [ ] Vault: create, edit, delete, pin, favourite, reorder, copy, attachments.
- [ ] Vault folders: same as folders.
- [ ] Backup: export → import → identical data.
- [ ] Import/Export: all three formats, BOM, folder restore.
- [ ] Themes: all five.
- [ ] Window: tray, close/minimize-to-tray, always-on-top, size presets, popover, splash.
- [ ] Global search shortcut.
- [ ] Notifications, open-external.
- [ ] Updater flow.
- [ ] Onboarding flow.
- [ ] App version + platform display.

## Data migration

1. On the Electron app: *Export* an encrypted backup.
2. On the Tauri app: *Restore* that file.
3. Verify row counts and spot-check vault decryption.
4. Keep the Electron DB untouched as a rollback.

## Cutover

1. Freeze `D:\Dev\QuickPrompt` (Electron) — tag its final release, keep the branch read-only.
2. Decide the release path:
   - **Option 1 — upgrade in place:** publish Tauri as QuickPrompt 3.0.0 from the same repo/name.
   - **Option 2 — new product:** separate repo/name; the Electron app stays maintained.
3. Ship, monitor crash reports and update adoption for one release cycle.

## Done when

- [ ] Every checklist box is green.
- [ ] A real user backup restores perfectly.
- [ ] Installer tested on a clean Windows machine (and macOS if shipping it).
- [ ] Release decision recorded in this folder.

## Risks

- Do not ship until Phase 4 (vault) is proven with real data — it is the only irreversible data path.
- Keep the Electron build downloadable until the Tauri release has one stable cycle.
