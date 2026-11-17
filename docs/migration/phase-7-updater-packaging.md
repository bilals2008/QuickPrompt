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

## Done when

- [ ] `cargo tauri build` produces installers for all three platforms.
- [ ] Installer runs on a clean machine and reaches the same UI.
- [ ] Updater checks a release, downloads, and installs with matching progress events.
- [ ] CI publishes artifacts to GitHub releases.

## Risks

- Auto-update requires signed updates; losing the signing key blocks future updates — store it securely.
- macOS notarization needs an Apple Developer certificate; Windows SmartScreen needs a code-signing cert. Plan procurement early.
- Version numbering: decide whether this ships as QuickPrompt 3.x or a separate product before publishing.
