# Phase 8 — Parity Gate & Cutover

**Goal:** prove the Tauri build matches Electron feature-for-feature, migrate real data safely, then decide the release path.

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
