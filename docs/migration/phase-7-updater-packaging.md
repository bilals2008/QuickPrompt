# Phase 7 — Updater & Packaging

**Goal:** replace `electron-updater` + `electron-builder` with Tauri's updater and bundler, shipping the same artifact types.

## Inputs

- `electron/main.js` — `autoUpdater` wiring and `update:*` handlers.
- `electron/preload.js` — `updateAPI` (10 methods + `onEvent`).
- `package.json` → `build` block (electron-builder config).

## Steps

1. Add `tauri-plugin-updater`. Configure the GitHub releases endpoint (owner/repo) and generate signing keys (`cargo tauri signer generate`).
2. Port `update:*` commands: check, download, install, get-status, auto-check/auto-download get/set. Emit `update:event` equivalents so the existing UI progress/ETA components work.
3. Bundle targets: Windows `nsis`, macOS `dmg` (x64 + arm64), Linux `AppImage` + `deb` — same as `package.json` today.
4. Icon set: reuse `build/icon.png`; generate the `.ico`/`.icns`/PNG set Tauri expects.
5. Artifact naming: match `QuickPrompt-Setup-${version}.exe`, `QuickPrompt-${version}.dmg`, etc.
6. CI: update `.github/workflows` to build Tauri artifacts; keep matrix for the three OSes.

## Status (2026-11-22)

Implemented:

- `tauri-plugin-updater` added; the static GitHub Releases endpoint
  (`.../releases/latest/download/latest.json`) and public key are configured.
- Signing keypair generated at `%USERPROFILE%\.tauri\quickprompt.key`
  (outside the repo, no password). **Add that file as the
  `TAURI_SIGNING_PRIVATE_KEY` repository secret** (and an empty
  `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`). Losing it blocks future updates.
- `update:*` commands ported (`commands/update.rs`; state and logic in
  `src-tauri/src/update.rs`): check, download, install, get-status,
  auto-check/auto-download get+set. Progress arrives as `qp:update` events with
  the same payload keys Electron used; `api.update.*` and `onEvent` are wired
  in `src/lib/api/tauri.js`.
- Startup auto-check after 3s, the tray "Check for Updates…" delay, and
  download-on-available match Electron.
- `.github/workflows/release.yml` builds NSIS (Windows), DMG (macOS x64 +
  arm64) and AppImage + deb (Linux), then publishes the assets plus
  `latest.json` from `scripts/update-manifest.mjs`.

Verified locally:

- `cargo clippy --all-targets`, `npm test`, `npm run lint` all green.
- `cargo tauri build --bundles nsis` produces
  `QuickPrompt_2.6.0_x64-setup.exe` and its `.sig`; the packaged app launches.
- `node scripts/update-manifest.mjs` emits a valid manifest for the build.

Still open (needs a person or a real runner):

- [ ] Installer tested on a clean machine.
- [ ] A live update check → download → install against a published release.
- [ ] macOS/Linux CI jobs actually executed; Windows/macOS code-signing and
      Apple notarization certificates procured.

Deviations:

- Tauri 2 has no `artifactName` setting, so bundle filenames are Tauri-derived
  (`QuickPrompt_2.6.0_x64-setup.exe`), not electron-builder's.
- Native OS notifications for "update available"/"downloaded" are not shown;
  the existing in-app toasts cover both moments.

## Done when

- [ ] `cargo tauri build` produces installers for all three platforms.
- [ ] Installer runs on a clean machine and reaches the same UI.
- [ ] Updater checks a release, downloads, and installs with matching progress events.
- [ ] CI publishes artifacts to GitHub releases.

## Risks

- Auto-update requires signed updates; losing the signing key blocks future updates — store it securely.
- macOS notarization needs an Apple Developer certificate; Windows SmartScreen needs a code-signing cert. Plan procurement early.
- Version numbering: decide whether this ships as QuickPrompt 3.x or a separate product before publishing.
