# Commits and releases

## Commits

- Never add a `Co-Authored-By` trailer, a "Generated with" line, or any other
  attribution. Strictly no co-authors.
- One line, English, conventional prefix (`feat(scope): ...`), no commit body.
- Commit a change as one commit. Do not split a working tree into small
  per-layer commits; separate commits are only for genuinely unrelated work.

## What's New / release notes

- `src/lib/changelog.js` is the single source of truth for reader-facing notes.
  The in-app popup (`src/features/whats-new/`) reads it; `CHANGELOG.md` mirrors
  it for the repo and the GitHub release body.
- Before every release, add an entry at the top of `CHANGELOG` with short, plain
  sentences a non-technical user understands. Never copy commit subjects into
  it and never show developer words in the popup.
- The startup popup shows once per newer version and never interrupts an active
  download. Settings > About and Help > What's new must reopen the notes
  manually.

## Release / CI

- `.github/workflows/release.yml` triggers on `v*` tag pushes. It builds
  Windows NSIS, macOS DMG + updater archive (x64 and arm64) and Linux
  AppImage + deb, then publishes assets and `latest.json`.
- Updater signing needs the `TAURI_SIGNING_PRIVATE_KEY` repo secret (and
  optionally `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`). Losing the key blocks
  future updates. The macOS archive name is derived from the tag version.
- Do not delete published releases: they are the rollback path.
